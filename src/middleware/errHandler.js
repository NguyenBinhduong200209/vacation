const errHandler = (err, req, res, next) => {
  console.log(err.stack); // Log the error stack trace to the console

  const msg = err.message;
  switch (err.name) {
    // If the error is a validation error, return a 400 Bad Request status code with the validation errors as JSON
    case "ValidationError":
      const result = Object.keys(err.errors).reduce(
        (obj, key) => Object.assign(obj, { [key]: err.errors[key].message }),
        {}
      );
      return res.status(400).json({ msg: result });

    case "TypeError":
      return res.status(400).json({ msg });

    case "CastError":
      return res.status(400).json({ msg });

    default:
      return res.status(err.status || 500).json({ msg });
  }
};

export default errHandler;
