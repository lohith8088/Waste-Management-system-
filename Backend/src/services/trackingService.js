const Location = require("../models/Location");
const User = require("../models/User");

const saveCollectorLocation = async ({ collectorId, latitude, longitude, timestamp }) => {
  const location = await Location.create({
    collectorId,
    latitude,
    longitude,
    timestamp: timestamp || new Date(),
  });

  await User.findByIdAndUpdate(collectorId, {
    lastKnownLocation: {
      latitude,
      longitude,
      timestamp: location.timestamp,
    },
  });

  return location;
};

module.exports = {
  saveCollectorLocation,
};
