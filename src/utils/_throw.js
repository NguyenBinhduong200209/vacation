const _throw = ({ errors, meta, message, code }) => {
  !message && (message = "");
  !code && (code = 500);
  throw { errors, meta, code, message };
};

export default _throw;
