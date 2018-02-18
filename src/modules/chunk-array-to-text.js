function chunkArrayToText(chunkArray) {
    let text = "";
    const decoder = new TextDecoder();
    for (let i = 0; i < chunkArray.length; i++) {
        text += decoder.decode(chunkArray[i]);
    }
    return text;
}

export default chunkArrayToText;