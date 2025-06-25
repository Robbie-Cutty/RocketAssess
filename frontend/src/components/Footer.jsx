import '../styles/globals.css';

const Footer = () => (
  <footer className="footer">
    &copy; {new Date().getFullYear()} Rocket Assess. All rights reserved.<br />
    <span className="text-sm">Need help? <a href="mailto:support@rocketassess.com" className="text-primary">Contact Support</a></span>
  </footer>
);

export default Footer;
