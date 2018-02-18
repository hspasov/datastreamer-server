function* fileChunkGenerator(file, reader, chunkSize) {
    let received = 0;
    while (file.size > received) {
        const slice = file.slice(received, received + chunkSize);
        reader.readAsArrayBuffer(slice);
        received += chunkSize;
        yield received;
    }
}

export default fileChunkGenerator;