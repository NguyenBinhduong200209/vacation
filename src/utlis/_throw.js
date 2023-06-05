const _throw = (status, message) => {
  !message && (message = "");
  throw { status, message };
};

export default _throw;
