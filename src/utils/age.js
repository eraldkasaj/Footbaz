export const calculateAgeFromBirthdate = (birthdate) => {
  if (!birthdate) return null;

  const [year, month, day] = birthdate.split("-").map(Number);

  if (!year || !month || !day) return null;

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasNotHadBirthdayYet =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);

  if (hasNotHadBirthdayYet) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

export const getPlayerAge = (profile) => {
  const birthdate = profile?.birthdate || profile?.dateOfBirth;
  const computedAge = calculateAgeFromBirthdate(birthdate);

  if (computedAge !== null) return computedAge;

  const storedAge = Number(profile?.age);

  return Number.isFinite(storedAge) && storedAge >= 0 ? storedAge : null;
};

export const formatBirthdate = (value) => {
  if (!value) return "";

  const [year, month, day] = value.split("-");

  if (day && month && year) {
    return `${day}.${month}.${year}`;
  }

  return value;
};
