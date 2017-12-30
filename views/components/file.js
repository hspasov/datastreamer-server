import React from "react";
import { Accordion, Button, Header, Icon, Item, Popup, Progress } from "semantic-ui-react";
import Thumbnail from "../components/thumbnail";

class File extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showMore: false
        };

        this.toggleMore = this.toggleMore.bind(this);
    }

    toggleMore() {
        this.setState(prevState =>  ({
            showMore: !prevState.showMore
        }));
    }

    render() {
        return <Item>
            <Item.Content>
                <Thumbnail
                    mime={this.props.fileData.mime}
                    thumbnail={this.props.fileData.imageURL}
                    onClick={() => this.props.getThumbnail()} />
                {(this.props.fileData.type === "directory") ?
                    <Item.Header size="huge" as="a" onClick={() => this.props.openDirectory()}>{this.props.fileData.name}</Item.Header> :
                    <Item.Header size="huge">{this.props.fileData.name}</Item.Header>
                }
                <Button floated="right" onClick={() => this.toggleMore()}><Icon size="huge" name="list layout" /></Button>
                {(this.props.fileData.mime === "image/png" || this.props.fileData.mime === "image/jpeg") &&
                    <Button onClick={() => this.props.openImage()}>View image</Button>
                }
                {(/^text\//.test(this.props.fileData.mime)) &&
                    <Button onClick={() => this.props.openText()}>View text file</Button>
                }
                <div>{this.props.fileData.type !== "directory" &&
                    <Button
                        disabled={this.props.fileData.downloadStatus === "initialized"}
                        loading={this.props.fileData.downloadStatus === "initialized"}
                        onClick={() => this.props.addToDownloads()}>
                        Download file
                    </Button>
                }</div>
                <Button onClick={() => this.props.selectFile()}>Select</Button>
                {this.state.showMore &&
                    <div>
                        <Item.Meta>Type: {this.props.fileData.type}</Item.Meta>
                        <Item.Meta>Mime: {this.props.fileData.mime}</Item.Meta>
                        <Item.Meta>Size: {this.props.fileData.size}</Item.Meta>
                        <Item.Meta>Path: {this.props.fileData.path}</Item.Meta>
                        <Header>Permissions:
                                <p>
                                {this.props.fileData.access.read && <Popup
                                    trigger={<Icon name="eye" size="big" />}
                                    content="Read access"
                                />}
                                {this.props.fileData.access.write && <Popup
                                    trigger={<Icon name="write" size="big" />}
                                    content="Write access"
                                />}
                                {this.props.fileData.access.execute && <Popup
                                    trigger={<Icon name="external" size="big" />}
                                    content="Execute access"
                                />}
                            </p>
                        </Header>
                    </div>}
                <div>
                    {this.props.fileData.downloadPercent > 0 && <Progress percent={this.props.fileData.downloadPercent} indicating />}
                </div>
            </Item.Content>
        </Item>
    }
}

export default File;
