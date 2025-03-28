const API_URL = "https://restcountries.com/v3.1/all";

export const getCountryCodes = async () => {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Format de réponse invalide");
    }

    // Extraire le nom du pays et son code de téléphone
    const countriesArray = data
      .filter(country => country.idd && country.idd.root)  // Vérifie si l'info existe
      .map(country => ({
        country: country.name.common,
        countryCode: `${country.idd.root}${country.idd.suffixes ? country.idd.suffixes[0] : ''}`
      }));

    return countriesArray;
  } catch (error) {
    console.error("Erreur lors de la récupération des codes de pays", error);
    return [];  // Retourne un tableau vide pour éviter l'erreur `map is not a function`
  }
};
