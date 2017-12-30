import path from "path";
import React from "react";
import { connect } from "react-redux";
import { Breadcrumb, Menu } from "semantic-ui-react";

class Navigation extends React.Component {
    render() {
        return <Menu.Item as={Breadcrumb}>
            <Breadcrumb.Section link><p>{this.props.provider.username}</p></Breadcrumb.Section>
            {this.props.navigation.path.map((dir, i) => {
                return <div key={i}>
                    <Breadcrumb.Divider />
                    <Breadcrumb.Section link onClick={() => this.props.navigateBack(i + 1)}><p>{dir}</p></Breadcrumb.Section>
                </div>;
            })}
        </Menu.Item>;
    }
}

const NavigationComponent = connect(store => {
    return {
        provider: store.provider,
        navigation: store.navigation
    };
})(Navigation);

export default NavigationComponent;