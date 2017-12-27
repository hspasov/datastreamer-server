const setText = text => {
    return {
        type: "SET_TEXT",
        payload: text
    };
};

const removeText = () => {
    return { type: "REMOVE_TEXT" };
};

export {
    setText,
    removeText
};