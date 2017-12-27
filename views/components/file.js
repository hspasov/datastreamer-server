import React from "react";
import { Button, Item, Progress } from "semantic-ui-react";
import Thumbnail from "../components/thumbnail.component";

class File extends React.Component {
    render() {
        return <Item>
            <Item.Content>
                <Thumbnail
                    mime={this.props.mime}
                    thumbnail={this.props.imageURL}
                    onClick={() => this.props.getThumbnail()} />
                <Item.Header>{this.props.name}</Item.Header>
                {(this.props.type == "directory") ?
                    <Button floated="right" onClick={() => this.props.openDirectory()}>Open directory</Button> :
                    <Button
                        floated="right"
                        disabled={this.props.downloadStatus === "initialized"}
                        loading={this.props.downloadStatus === "initialized"}
                        onClick={() => this.props.addToDownloads()}>
                        Download file
                    </Button>
                }
                <Item.Meta>Type: {this.props.type}</Item.Meta>
                <Item.Meta>Mime: {this.props.mime}</Item.Meta>
                <Item.Meta>Size: {this.props.size}</Item.Meta>
                <Item.Meta>Read access: {this.props.access.read.toString()}</Item.Meta>
                <Item.Meta>Write access: {this.props.access.write.toString()}</Item.Meta>
                <Item.Meta>Execute access: {this.props.access.execute.toString()}</Item.Meta>
                <div>
                    {this.props.downloadPercent > 0 && <Progress percent={this.props.downloadPercent} indicating />}
                </div>
            </Item.Content>
        </Item>
    }
}

export default File;
