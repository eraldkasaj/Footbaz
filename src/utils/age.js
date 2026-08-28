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

// Sot, si "YYYY-MM-DD" në kohën lokale — përdoret si `max` te fushat e datës
// që picker-i i browser-it të mos lejojë fare zgjedhjen e një date në të
// ardhmen (mbrojtje shtesë përpara validimit real më poshtë).
export const getTodayDateString = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
};

// Kontrollon që një datëlindje e futur nga përdoruesi të jetë realiste —
// jo në të ardhmen, jo një datë e pavlefshme (p.sh. 30 shkurt), dhe jo aq e
// vjetër sa mosha e llogaritur të jetë e pamundur. Kthen mesazhin e gabimit
// (shqip, gati për t'u shfaqur) ose null nëse data është e vlefshme apo
// bosh (fusha bosh trajtohet veç, si "e detyrueshme", diku tjetër).
export const getBirthdateError = (birthdate) => {
  if (!birthdate) return null;

  const [year, month, day] = birthdate.split("-").map(Number);

  if (!year || !month || !day) return "Datëlindja e futur nuk është e vlefshme.";

  const parsed = new Date(year, month - 1, day);
  const isRealCalendarDate =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;

  if (!isRealCalendarDate) return "Datëlindja e futur nuk është e vlefshme.";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsed > today) return "Datëlindja nuk mund të jetë në të ardhmen.";

  const age = calculateAgeFromBirthdate(birthdate);

  if (age === null || age > 100) return "Datëlindja e futur nuk është realiste.";

  return null;
};

export const formatBirthdate = (value) => {
  if (!value) return "";

  const [year, month, day] = value.split("-");

  if (day && month && year) {
    return `${day}.${month}.${year}`;
  }

  return value;
};
