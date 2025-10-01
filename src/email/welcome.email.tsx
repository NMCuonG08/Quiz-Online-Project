import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  displayName: string;
  username: string;
  password?: string;
  baseUrl: string;
  customTemplate?: string;
}

export const WelcomeEmail = ({
  displayName,
  username,
  password,
  baseUrl,
}: WelcomeEmailProps): React.JSX.Element => {
  return (
    <Html>
      <Head />
      <Preview>Chào mừng bạn đến với hệ thống của chúng tôi!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Heading style={h1}>Chào mừng!</Heading>
          </Section>

          <Text style={text}>
            Xin chào <strong>{displayName}</strong>,
          </Text>

          <Text style={text}>
            Chúng tôi rất vui được chào đón bạn tham gia vào hệ thống của chúng
            tôi!
          </Text>

          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Thông tin tài khoản của bạn:</strong>
            </Text>
            <Text style={infoText}>
              Tên đăng nhập: <strong>{username}</strong>
            </Text>
            {password && (
              <Text style={infoText}>
                Mật khẩu: <strong>{password}</strong>
              </Text>
            )}
          </Section>

          <Text style={text}>
            Bạn có thể đăng nhập vào hệ thống bằng thông tin trên.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={`${baseUrl}/login`}>
              Đăng nhập ngay
            </Button>
          </Section>

          <Text style={text}>
            Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.
          </Text>

          <Text style={footer}>
            Trân trọng,
            <br />
            Đội ngũ hỗ trợ
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logoContainer = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const infoText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  color: '#6c757d',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 0',
};

export default WelcomeEmail;
