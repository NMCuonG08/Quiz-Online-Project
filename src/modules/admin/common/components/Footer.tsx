import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xl font-semibold">
              <span className="inline-block rounded-sm bg-black text-white px-2 py-1">
                O
              </span>
              <span>Olando</span>
            </div>
            <div className="text-xs text-muted-foreground">
              © 2025 Olando, Inc.
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm font-semibold">Contact</div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Twitter</li>
              <li>Discord</li>
              <li>Github</li>
              <li>LinkedIn</li>
            </ul>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm font-semibold">Resources</div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Docs</li>
              <li>Pricing</li>
              <li>Support</li>
              <li>Examples</li>
            </ul>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm font-semibold">Company</div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Blog</li>
              <li>About</li>
              <li>Careers</li>
              <li>Contact Us</li>
            </ul>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm font-semibold">Legal</div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Terms</li>
              <li>Privacy</li>
              <li>Fair Use</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-muted-foreground">
          Not affiliated with any trademarks mentioned.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
