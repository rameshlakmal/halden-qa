// The one place that reads the environment. Tests and fixtures import from here, never from process.env.
import 'dotenv/config';

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} in .env (see .env.example) or in the CI secrets.`);
  return value;
};
const trimmed = (url: string) => url.replace(/\/$/, '');

export const env = {
  shopUrl: trimmed(process.env.SHOP_URL ?? 'https://halden-outfitters.vercel.app'),
  adminUrl: trimmed(process.env.ADMIN_URL ?? 'https://halden-admin.vercel.app'),
  apiUrl: trimmed(process.env.API_URL ?? 'https://halden-api.vercel.app'),
  admin: {
    get email() {
      return process.env.HALDEN_ADMIN_EMAIL ?? 'admin@halden.test';
    },
    get password() {
      return required('HALDEN_ADMIN_PASSWORD');
    },
  },
  ci: !!process.env.CI,
};
