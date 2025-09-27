import { authenticator } from "otplib";

export function newTotpSecret() {
  return authenticator.generateSecret(); // base32
}

export function totpUri({
  secret,
  label,
  issuer,
}: { secret: string; label: string; issuer: string }) {
  return authenticator.keyuri(label, issuer, secret);
}

export function verifyTotp(secret: string, token: string) {
  return authenticator.check(token, secret);
}
