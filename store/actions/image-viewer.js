function setImage(imageURL) {
    return {
        type: "SET_IMAGE",
        payload: imageURL
    };
}

function removeImage() {
    return { type: "REMOVE_IMAGE" };
};

export {
    setImage,
    removeImage
};