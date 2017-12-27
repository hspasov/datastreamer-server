const setImage = imageURL => {
    return {
        type: "SET_IMAGE",
        payload: imageURL
    };
};

const removeImage = () => {
    return { type: "REMOVE_IMAGE" };
};

export {
    setImage,
    removeImage
};