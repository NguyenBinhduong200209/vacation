const errHandler = (err, req, res, next) => {
  console.log(err.stack); // Log the error stack trace to the console

  // If the error is a validation error, return a 400 Bad Request status code with the validation errors as JSON
  return err.name === "ValidationError"
    ? res.status(400).json(
        Object.keys(err.errors).reduce((obj, key) => {
          obj[key] = err.errors[key].message;
          return obj;
        }, {})
      )
    : err.name === "CastError"
    ? res.status(400).json(err.message)
    : err.status
    ? // If the error has a status property, return that status code with the error message as JSON
      res.status(err.status).json(err.message)
    : // Otherwise, return a 500 Internal Server Error status code with a generic error message
      res.status(500).send(err.message);
};

export default errHandler;
