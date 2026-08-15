export function authUiState(authorized, requestedRole, publicRole = 'guest') {
  const loggedIn = authorized === true;
  return {
    loggedIn,
    activeRole: loggedIn ? requestedRole : publicRole,
  };
}
