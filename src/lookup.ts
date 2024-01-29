/*export const nodeTypeLookup: Record<string, string> = {
    "geschlecht": "binary",
    "alter": "range",
    "gewicht": "range",
    "groesse": "range",
    "trainingsleistung": "range",
    "blutwerte": "range",
    "vitaminD": "range",
} */
export const nodeTypeLookup = new Map<string, string>([
    ["geschlecht", "binary"],
    ["alter", "range"],
    ["gewicht", "range"],
    ["groesse", "range"],
    ["trainingsleistung", "range"],
    ["blutwerte", "range"],
    ["vitaminD", "range"],
]);

export const compareOperatorLookup = new Map<string, string>([
    ["<", ">="],
    [">", "<="],
    ["<=", ">"],
    [">=", "<"],
    ["=", "!="],
    ["!=", "="],
])