const { cuisines } = require('../../utils/enums');

exports.getCuisines = (req, res, next) => {
  const tmp = cuisines.map((c) => c.toLowerCase());
  return res.json(tmp);
};
