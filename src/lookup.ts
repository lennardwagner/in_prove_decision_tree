//Maps categories to input types on the Pop-up
export const nodeTypeLookup = new Map<string, string>([
    ["sex", "binary"],
    ["age", "range"],
    ["weight", "range"],
    ["height", "range"],
    ["high jump", "range"],
    ["30m", "range"],
    ["bench press", "range"],
    ["iq", "range"],
    ["resting heartrate", "range"],
    ["reaction time", "range"],
    ["vitamind", "range"],
    ["peak heartrate", "range"],

]);

export const compareOperatorLookup = new Map<string, string>([
    ["<", ">="],
    [">", "<="],
    ["<=", ">"],
    [">=", "<"],
    ["=", "!="],
    ["!=", "="],
])