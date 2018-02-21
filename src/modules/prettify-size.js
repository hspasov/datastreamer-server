function prettifySize(size) {
    const units = ["bytes", "KB", "MB", "GB", "TB"];
    let i = 0;
    while (size > 1024 && i < units.length) {
        size /= 1024;
        i++;
    }
    return `${Number.parseFloat(size).toFixed(1)} ${units[i]}`;
}

export default prettifySize;