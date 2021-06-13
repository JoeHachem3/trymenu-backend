module.exports = (res, error) => {
  return res.status(500).json({
    ...error,
    message: 'Oops, something went wrong... please try again later!',
  });
};
