import React from "react";
import { withRouter } from "react-router-dom";
import { Button, Container, Grid, Header, Icon, Segment } from "semantic-ui-react";
import { Helmet } from "react-helmet";

class Index extends React.Component {
    render() {
        return <Segment className="index-page" inverted padded="very">
            <Helmet>
                <style>{`
                    body > div,
                    body > div > div,
                    body > div > div > div.index-page {
                        height: 100%;
                    }
                `}</style>
            </Helmet>
            <Grid style={{ height: "100%" }} textAlign="center" verticalAlign="middle">
                <Grid.Row columns={2}>
                    <Grid.Column textAlign="center">
                        <Header
                            as="h1"
                            content="Download provider"
                            inverted
                        />
                        <Header
                            as="h4"
                            content="Select a directory to scan and leave your computer running."
                            inverted
                        />
                        <Button primary animated="fade" size="huge">
                            <Button.Content visible>Download</Button.Content>
                            <Button.Content hidden><Icon name="download" size="large" /></Button.Content>
                        </Button>
                    </Grid.Column>
                    <Grid.Column textAlign="center">
                        <Header
                            as="h1"
                            content="Easily access your storage"
                            inverted
                        />
                        <Header
                            as="h4"
                            content="Use your account and connect to provider to browse your shared directories."
                            inverted
                        />
                        <Grid>
                            <Grid.Column>
                                <Button.Group>
                                    <Button animated onClick={() => this.props.history.push("/login")}>
                                        <Button.Content visible>Login</Button.Content>
                                        <Button.Content hidden><Icon name="right arrow" /></Button.Content>
                                    </Button>
                                    <Button.Or/>
                                    <Button animated positive onClick={() => this.props.history.push("/register")}>
                                        <Button.Content visible>Create an account</Button.Content>
                                        <Button.Content hidden><Icon name="right arrow" /></Button.Content>
                                    </Button>
                                </Button.Group>
                            </Grid.Column>
                        </Grid>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Segment>;
    }
}

const IndexPage = withRouter(Index);

export default IndexPage;