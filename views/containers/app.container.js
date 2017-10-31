import React from "react";
import { Container, Divider, Dropdown, Grid, Header, Image, List, Menu, Segment } from "semantic-ui-react";
import { Navbar, Button } from "react-bootstrap";
import { connect } from "react-redux";
import SidebarNavComponent from "../components/sidebarNav";

class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <Menu fixed='top' inverted>
                    <Container>
                        <Menu.Item as='a' header>
                            <Image
                                size='mini'
                                src='/logo.png'
                                style={{ marginRight: '1.5em' }}
                            />
                            DataStreamer
                        </Menu.Item>
                        <Menu.Item as='a'>Home</Menu.Item>
                        <Dropdown item simple text='Dropdown'>
                            <Dropdown.Menu>
                                <Dropdown.Item>List Item</Dropdown.Item>
                                <Dropdown.Item>List Item</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Header>Header Item</Dropdown.Header>
                                <Dropdown.Item>
                                    <i className='dropdown icon' />
                                    <span className='text'>Submenu</span>
                                    <Dropdown.Menu>
                                        <Dropdown.Item>List Item</Dropdown.Item>
                                        <Dropdown.Item>List Item</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown.Item>
                                <Dropdown.Item>List Item</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Container>
                </Menu>
                <SidebarNavComponent history={this.props.history}>
                    <Container text style={{ marginTop: '7em' }}>
                        {this.props.children}
                    </Container>

                    <Segment
                        inverted
                        vertical
                        style={{ margin: '5em 0em 0em', padding: '5em 0em' }}
                    >
                        <Container textAlign='center'>
                            <Grid divided inverted stackable>
                                <Grid.Row>
                                    <Grid.Column width={3}>
                                        <Header inverted as='h4' content='Group 1' />
                                        <List link inverted>
                                            <List.Item as='a'>Link One</List.Item>
                                            <List.Item as='a'>Link Two</List.Item>
                                            <List.Item as='a'>Link Three</List.Item>
                                            <List.Item as='a'>Link Four</List.Item>
                                        </List>
                                    </Grid.Column>
                                    <Grid.Column width={3}>
                                        <Header inverted as='h4' content='Group 2' />
                                        <List link inverted>
                                            <List.Item as='a'>Link One</List.Item>
                                            <List.Item as='a'>Link Two</List.Item>
                                            <List.Item as='a'>Link Three</List.Item>
                                            <List.Item as='a'>Link Four</List.Item>
                                        </List>
                                    </Grid.Column>
                                    <Grid.Column width={3}>
                                        <Header inverted as='h4' content='Group 3' />
                                        <List link inverted>
                                            <List.Item as='a'>Link One</List.Item>
                                            <List.Item as='a'>Link Two</List.Item>
                                            <List.Item as='a'>Link Three</List.Item>
                                            <List.Item as='a'>Link Four</List.Item>
                                        </List>
                                    </Grid.Column>
                                    <Grid.Column width={3}>
                                        <Header inverted as='h4' content='Footer Header' />
                                        <p>Extra space for a call to action inside the footer that could help re-engage users.</p>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>

                            <Divider inverted section />
                            <Image
                                centered
                                size='mini'
                                src='/logo.png'
                            />
                            <List horizontal inverted divided link>
                                <List.Item as='a' href='#'>Site Map</List.Item>
                                <List.Item as='a' href='#'>Contact Us</List.Item>
                                <List.Item as='a' href='#'>Terms and Conditions</List.Item>
                                <List.Item as='a' href='#'>Privacy Policy</List.Item>
                            </List>
                        </Container>
                    </Segment>
                </SidebarNavComponent>
            </div>
        );
    }
}

const AppContainer = connect(store => {
    return {
        client: store.client,
        provider: store.provider
    };
})(App);

export default AppContainer;