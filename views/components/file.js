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
                    mime={this.props.mime}
                    thumbnail={this.props.imageURL}
                    onClick={() => this.props.getThumbnail()} />
                {(this.props.type === "directory") ?
                    <Item.Header size="huge" as="a" onClick={() => this.props.openDirectory()}>{this.props.name}</Item.Header> :
                    <Item.Header size="huge">{this.props.name}</Item.Header>
                }
                <Button floated="right" onClick={() => this.toggleMore()}><Icon size="huge" name="list layout" /></Button>
                {(this.props.mime === "image/png" || this.props.mime === "image/jpeg") &&
                    <Button onClick={() => this.props.openImage()}>View image</Button>
                }
                {(/^text\//.test(this.props.mime)) &&
                    <Button onClick={() => this.props.openText()}>View text file</Button>
                }
                <div>{this.props.type !== "directory" &&
                    <Button
                        disabled={this.props.downloadStatus === "initialized"}
                        loading={this.props.downloadStatus === "initialized"}
                        onClick={() => this.props.addToDownloads()}>
                        Download file
                    </Button>
                }</div>
                <Button onClick={() => this.props.selectFile()}>Select</Button>
                {this.state.showMore &&
                    <div>
                        <Item.Meta>Type: {this.props.type}</Item.Meta>
                        <Item.Meta>Mime: {this.props.mime}</Item.Meta>
                        <Item.Meta>Size: {this.props.size}</Item.Meta>
                        <Item.Meta>Path: {this.props.path}</Item.Meta>
                        <Header>Permissions:
                                <p>
                                {this.props.access.read && <Popup
                                    trigger={<Icon name="eye" size="big" />}
                                    content="Read access"
                                />}
                                {this.props.access.write && <Popup
                                    trigger={<Icon name="write" size="big" />}
                                    content="Write access"
                                />}
                                {this.props.access.execute && <Popup
                                    trigger={<Icon name="external" size="big" />}
                                    content="Execute access"
                                />}
                            </p>
                        </Header>
                    </div>}
                <div>
                    {this.props.downloadPercent > 0 && <Progress percent={this.props.downloadPercent} indicating />}
                </div>
            </Item.Content>
        </Item>
    }
}

export default File;
