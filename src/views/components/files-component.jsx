import React from "react";
import { connect } from "react-redux";
import { Item } from "semantic-ui-react";
import { addToSelected } from "../../store/actions/selection";
import File from "./file.jsx";

class Files extends React.Component {
    render() {
        return <Item.Group divided>
            {!this.props.dimmer.show && this.props.files.files.map((file, i) => {
                return <File
                    key={file.path}
                    fileData={file}
                    openDirectory={() => this.props.openDirectory(file.path)}
                    openImage={() => this.props.addToDownloads(file, "image")}
                    openText={() => this.props.addToDownloads(file, "text")}
                    downloadStatus={(file.type !== "directory") ? file.download.status : null}
                    addToDownloads={() => this.props.addToDownloads(file, "file")}
                    downloadPercent={/*(this.props.download.current && this.props.download.current.path === file.path) ? this.state.downloadPercent :*/ 0}
                    selectFile={() => this.props.addToSelected(file)}
                />
            })}
        </Item.Group>;
    }
}

const FilesComponent = connect(store => {
    return {
        dimmer: store.dimmer,
        files: store.files
    };
}, { addToSelected })(Files);

export default FilesComponent;