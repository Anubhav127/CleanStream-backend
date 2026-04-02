export const verifyEmailTemplate = (link) => {
    return `
    <h2>Verify your email</h2>
    <a href="${link}">Click to verify</a>
  `;
}

export const resetPasswordTemplate = (link) => {
    return `
    <h2>Reset Password</h2>
    <a href="${link}">Reset here</a>
  `;
}