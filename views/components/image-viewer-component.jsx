import React from "react";
import { connect } from "react-redux";
import { Image } from "semantic-ui-react";

class ImageViewer extends React.Component {
    render() {
        return <div>
            <Image style={{ display: "block", margin: "0 auto" }} src={this.props.imageViewer.imageURL} />
        </div>;
    }
}

const ImageViewerComponent = connect(store => {
    return {
        imageViewer: store.imageViewer
    };
})(ImageViewer);

export default ImageViewerComponent;