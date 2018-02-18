import React from "react";
import { Accordion, Button, Header, Icon, Item, Popup, Progress } from "semantic-ui-react";
import Thumbnail from "../components/thumbnail.jsx";

class File extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showMore: false
        };
    }

    toggleMore() {
        this.setState(prevState =>  ({
            showMore: !prevState.showMore
        }));
    }

    render() {
        return <Item>
            <Item.Content>
                <Thumbnail mime={this.props.fileData.mime} />
                {(this.props.fileData.type === "directory") ?
                    <Item.Header size="huge" as="a" onClick={() => this.props.openDirectory()}>{this.props.fileData.name}</Item.Header> :
                    <Item.Header size="huge">{this.props.fileData.name}</Item.Header>
                }
                <Button size="mini" floated="right" onClick={() => this.toggleMore()}><Icon size="large" name="list layout" /> Show more</Button>
                <Button size="mini" floated="right" onClick={() => this.props.selectFile()}><Icon size="large" name="checkmark" />Select</Button>
                {(this.props.fileData.mime === "image/png" || this.props.fileData.mime === "image/jpeg") &&
                    <Button size="mini" floated="right" onClick={() => this.props.openImage()}><Icon size="large" name="image" /> View image</Button>
                }
                {(/^text\//.test(this.props.fileData.mime)) &&
                    <Button size="mini" floated="right" onClick={() => this.props.openText()}><Icon size="large" name="file text" />View text file</Button>
                }
                {this.props.fileData.type !== "directory" &&
                    <Button
                        size="mini"
                        floated="right"
                        disabled={this.props.fileData.downloadStatus === "initialized"}
                        loading={this.props.fileData.downloadStatus === "initialized"}
                        onClick={() => this.props.addToDownloads()}>
                    <Icon size="large" name="download" />Download file
                    </Button>
                }
                {this.state.showMore &&
                    <div>
                        <Item.Meta>Type: {this.props.fileData.type}</Item.Meta>
                        <Item.Meta>Mime: {this.props.fileData.mime}</Item.Meta>
                        <Item.Meta>Size: {this.props.fileData.size}</Item.Meta>
                        <Item.Meta>Path: {this.props.fileData.path}</Item.Meta>
                        <Header>Permissions:
                                <p>
                                {this.props.fileData.access.read && <Popup
                                    trigger={<Icon name="eye" size="large" />}
                                    content="Read access"
                                />}
                                {this.props.fileData.access.write && <Popup
                                    trigger={<Icon name="write" size="large" />}
                                    content="Write access"
                                />}
                                {this.props.fileData.access.execute && <Popup
                                    trigger={<Icon name="external" size="large" />}
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
