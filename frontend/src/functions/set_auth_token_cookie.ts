export function setAuthTokenCookie(token: string, daysToExpire: number = 15) {
  const d = new Date();
  d.setTime(d.getTime() + daysToExpire * 24 * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();

  document.cookie = `authToken=${token}; ${expires}; path=/`;
}
