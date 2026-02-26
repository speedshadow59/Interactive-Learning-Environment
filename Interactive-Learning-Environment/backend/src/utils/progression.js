const calculateLevelFromExperience = (experiencePoints) => {
  const safeExperience = Number.isFinite(Number(experiencePoints))
    ? Math.max(0, Number(experiencePoints))
    : 0;

  return Math.floor(safeExperience / 100) + 1;
};

module.exports = {
  calculateLevelFromExperience,
};
