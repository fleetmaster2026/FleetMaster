exports.normalizeText = (value) => {
    if (value === null || value === undefined) return value;

    if (typeof value !== "string") return value;

    return value.trim().toUpperCase();
};

exports.normalizeObject = (obj, exclude = []) => {

    const result = {};

    Object.keys(obj).forEach(key => {

        if (exclude.includes(key)) {
            result[key] = obj[key];
            return;
        }

        if (typeof obj[key] === "string") {
            result[key] = obj[key].trim().toUpperCase();
        } else {
            result[key] = obj[key];
        }

    });

    return result;
};