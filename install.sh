#!/usr/bin/env bash
set -o nounset
set -o pipefail

create_quiz_directory() {
  local -r Tgt='./quiz-app'
  echo "Creating Quiz App directory..."
  if [[ -e $Tgt ]]; then
    echo "Found existing directory $Tgt, will overwrite YAML files"
  else
    mkdir "$Tgt" || return
  fi
  cd "$Tgt" || return 1
}

copy_docker_compose_file() {
  echo "Copying docker-compose.yml..."
  if [[ -f ../docker/docker-compose.yml ]]; then
    cp ../docker/docker-compose.yml ./docker-compose.yml || return
    echo "✓ Docker Compose file copied"
  else
    echo "✗ Error: docker-compose.yml not found in ../docker/"
    return 1
  fi
}

create_server_env_file() {
  echo "Creating server .env file..."
  local server_env_path="../server/.env"
  local server_env_example="../server/env.example"
  
  if [[ -f "$server_env_path" ]]; then
    echo "✓ Server .env file already exists, skipping..."
    return 0
  fi
  
  if [[ -f "$server_env_example" ]]; then
    cp "$server_env_example" "$server_env_path" || return
    echo "✓ Server .env file created from env.example"
  else
    echo "✗ Error: env.example not found in ../server/"
    return 1
  fi
}

create_web_env_file() {
  echo "Creating web .env file..."
  local web_env_path="../web/.env"
  local web_env_local_path="../web/.env.local"
  
  # Create .env for Docker Compose (required)
  if [[ ! -f "$web_env_path" ]]; then
    cat > "$web_env_path" <<EOF
# API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Environment
NODE_ENV=development
EOF
    echo "✓ Web .env file created"
  else
    echo "✓ Web .env file already exists, skipping..."
  fi
  
  # Create .env.local for Next.js (optional, for local development)
  if [[ ! -f "$web_env_local_path" ]]; then
    cat > "$web_env_local_path" <<EOF
# API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Environment
NODE_ENV=development
EOF
    echo "✓ Web .env.local file created"
  fi
}

generate_random_password() {
  echo "Generating random password for database..."
  local server_env_path="../server/.env"
  
  if [[ ! -f "$server_env_path" ]]; then
    echo "✗ Error: Server .env file not found"
    return 1
  fi
  
  # Generate random password
  local rand_pass
  if command -v openssl >/dev/null 2>&1; then
    rand_pass=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
  elif command -v date >/dev/null 2>&1; then
    rand_pass=$(echo "$RANDOM$(date +%s)$RANDOM" | sha256sum | base64 | head -c25 | tr -d "=+/" 2>/dev/null || echo "postgres${RANDOM}${RANDOM}")
  else
    rand_pass="postgres${RANDOM}${RANDOM}"
  fi
  
  if [[ -z "$rand_pass" ]]; then
    rand_pass="postgres${RANDOM}${RANDOM}"
  fi
  
  # Add or update POSTGRES_PASSWORD in .env file
  if grep -q "^POSTGRES_PASSWORD=" "$server_env_path"; then
    # Update existing
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${rand_pass}|" "$server_env_path" 2>/dev/null || true
    else
      sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${rand_pass}|" "$server_env_path" 2>/dev/null || true
    fi
  else
    # Add new line
    echo "" >> "$server_env_path"
    echo "POSTGRES_PASSWORD=${rand_pass}" >> "$server_env_path"
  fi
  
  # Update DATABASE_URL in .env file
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|postgres://postgres:.*@|postgres://postgres:${rand_pass}@|" "$server_env_path" 2>/dev/null || true
    sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"postgres://postgres:${rand_pass}@db:5432/quiz\"|" "$server_env_path" 2>/dev/null || true
  else
    # Linux/Unix
    sed -i "s|postgres://postgres:.*@|postgres://postgres:${rand_pass}@|" "$server_env_path" 2>/dev/null || true
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"postgres://postgres:${rand_pass}@db:5432/quiz\"|" "$server_env_path" 2>/dev/null || true
  fi
  
  echo "✓ Random password generated and updated in .env file"
}

update_database_url() {
  echo "Updating DATABASE_URL in server .env..."
  local server_env_path="../server/.env"
  
  if [[ ! -f "$server_env_path" ]]; then
    return 0
  fi
  
  # Get POSTGRES_PASSWORD if exists
  local db_password
  if grep -q "^POSTGRES_PASSWORD=" "$server_env_path"; then
    db_password=$(grep "^POSTGRES_PASSWORD=" "$server_env_path" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
  fi
  
  # Update DATABASE_URL to use db as hostname (Docker service name) and quiz database
  if grep -q "^DATABASE_URL=" "$server_env_path"; then
    # Extract password from existing DATABASE_URL or use POSTGRES_PASSWORD
    if [[ -z "$db_password" ]]; then
      # Try to extract from existing DATABASE_URL
      local existing_url
      existing_url=$(grep "^DATABASE_URL=" "$server_env_path" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
      if [[ "$existing_url" =~ postgres://postgres:([^@]+)@ ]]; then
        db_password="${BASH_REMATCH[1]}"
      else
        db_password="postgres"
      fi
    fi
    
    # Update DATABASE_URL
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"postgres://postgres:${db_password}@db:5432/quiz\"|" "$server_env_path" 2>/dev/null || true
    else
      sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"postgres://postgres:${db_password}@db:5432/quiz\"|" "$server_env_path" 2>/dev/null || true
    fi
  else
    # Add DATABASE_URL if not exists
    if [[ -z "$db_password" ]]; then
      db_password="postgres"
    fi
    echo "" >> "$server_env_path"
    echo "DATABASE_URL=\"postgres://postgres:${db_password}@db:5432/quiz\"" >> "$server_env_path"
  fi
}

generate_jwt_secret() {
  echo "Generating JWT secret..."
  local server_env_path="../server/.env"
  
  if [[ ! -f "$server_env_path" ]]; then
    return 0
  fi
  
  # Check if JWT_SECRET is already set and not default
  if grep -q "^JWT_SECRET=" "$server_env_path"; then
    local existing_secret
    existing_secret=$(grep "^JWT_SECRET=" "$server_env_path" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [[ "$existing_secret" != "your-jwt-secret-key-here" ]] && [[ -n "$existing_secret" ]]; then
      echo "✓ JWT_SECRET already set, skipping..."
      return 0
    fi
  fi
  
  # Generate random JWT secret
  local jwt_secret
  if command -v openssl >/dev/null 2>&1; then
    jwt_secret=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
  elif command -v date >/dev/null 2>&1; then
    jwt_secret=$(echo "$RANDOM$(date +%s)$RANDOM" | sha256sum | base64 | head -c64 | tr -d "=+/" 2>/dev/null || echo "jwt-secret-${RANDOM}${RANDOM}")
  else
    jwt_secret="jwt-secret-${RANDOM}${RANDOM}"
  fi
  
  if [[ -z "$jwt_secret" ]]; then
    jwt_secret="jwt-secret-${RANDOM}${RANDOM}"
  fi
  
  # Update or add JWT_SECRET
  if grep -q "^JWT_SECRET=" "$server_env_path"; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=\"${jwt_secret}\"|" "$server_env_path" 2>/dev/null || true
    else
      sed -i "s|^JWT_SECRET=.*|JWT_SECRET=\"${jwt_secret}\"|" "$server_env_path" 2>/dev/null || true
    fi
  else
    echo "" >> "$server_env_path"
    echo "JWT_SECRET=\"${jwt_secret}\"" >> "$server_env_path"
  fi
  
  echo "✓ JWT secret generated and updated in .env file"
}

check_prerequisites() {
  echo "Checking prerequisites..."
  
  # Check Docker
  if ! command -v docker >/dev/null 2>&1; then
    echo "✗ Error: Docker is not installed. Please install Docker first."
    return 1
  fi
  
  # Check Docker Compose
  if ! docker compose version >/dev/null 2>&1 && ! docker-compose version >/dev/null 2>&1; then
    echo "✗ Error: Docker Compose is not installed. Please install Docker Compose first."
    return 1
  fi
  
  echo "✓ Prerequisites check passed"
  return 0
}

start_docker_compose() {
  echo "Starting Quiz App's docker containers..."
  
  if ! docker compose version >/dev/null 2>&1 && ! docker-compose version >/dev/null 2>&1; then
    echo "✗ Error: failed to find 'docker compose' or 'docker-compose'"
    return 1
  fi
  
  # Use docker compose if available, otherwise docker-compose
  local compose_cmd
  if docker compose version >/dev/null 2>&1; then
    compose_cmd="docker compose"
  else
    compose_cmd="docker-compose"
  fi
  
  echo "Building and starting containers..."
  if ! $compose_cmd up --build --remove-orphans -d; then
    echo "✗ Error: Could not start containers. Check for errors above."
    return 1
  fi
  
  show_friendly_message
}

show_friendly_message() {
  local ip_address="localhost"
  
  # Try to get IP address
  if command -v hostname >/dev/null 2>&1; then
    local hostname_ip
    hostname_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [[ -n "$hostname_ip" ]]; then
      ip_address="$hostname_ip"
    fi
  fi
  
  # macOS fallback
  if [[ "$OSTYPE" == "darwin"* ]] && [[ "$ip_address" == "localhost" ]]; then
    if command -v ipconfig >/dev/null 2>&1; then
      local mac_ip
      mac_ip=$(ipconfig getifaddr en0 2>/dev/null)
      if [[ -n "$mac_ip" ]]; then
        ip_address="$mac_ip"
      fi
    fi
  fi
  
  cat <<EOF

╔══════════════════════════════════════════════════════════════╗
║         ✓ Quiz App Successfully Deployed!                   ║
╚══════════════════════════════════════════════════════════════╝

🌐 Frontend (Web):     http://${ip_address}:3000
🔧 Backend (API):      http://${ip_address}:5000
📊 Database:          ${ip_address}:5432
🔴 Redis:             ${ip_address}:6379

📝 Configuration:
   - Server .env:      ../server/.env
   - Web .env.local:   ../web/.env.local
   - Docker Compose:   ./docker-compose.yml

🔄 To manage containers:
   - Stop:             docker compose down
   - Restart:          docker compose restart
   - View logs:        docker compose logs -f
   - Stop all:         docker compose down

💡 To configure custom settings:
   1. Bring down containers: docker compose down
   2. Edit .env files in ../server/ and ../web/
   3. Bring containers back up: docker compose up -d

📚 Next steps:
   - Wait a few moments for services to fully start
   - Check logs: docker compose logs -f
   - Access the frontend at http://${ip_address}:3000

EOF
}

# MAIN
main() {
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║         Quiz App - Quick Installation Script                ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  
  # Check prerequisites
  check_prerequisites || {
    echo "✗ Prerequisites check failed"
    return 14
  }
  
  # Create directory
  create_quiz_directory || {
    echo "✗ Error: Failed to create Quiz App directory"
    return 10
  }
  
  # Copy docker-compose file
  copy_docker_compose_file || {
    echo "✗ Error: Failed to copy Docker Compose file"
    return 11
  }
  
  # Create .env files
  create_server_env_file || {
    echo "✗ Error: Failed to create server .env file"
    return 12
  }
  
  create_web_env_file || {
    echo "✗ Error: Failed to create web .env file"
    return 12
  }
  
  # Generate random password
  generate_random_password
  
  # Update database URL
  update_database_url
  
  # Generate JWT secret if needed
  generate_jwt_secret
  
  # Start Docker Compose
  start_docker_compose || {
    echo "✗ Error: Failed to start Docker containers"
    return 13
  }
  
  return 0
}

main
Exit=$?
if [[ $Exit != 0 ]]; then
  echo ""
  echo "✗ There was an error installing Quiz App. Exit code: $Exit"
  echo "  Please provide these logs when asking for assistance."
fi
exit "$Exit"

