import path from "path";
import React from "react";
import { connect } from "react-redux";
import { Breadcrumb, Icon, Menu } from "semantic-ui-react";

class Navigation extends React.Component {
    render() {
        return <Menu.Menu>
            <div>
            <Menu.Item onClick={() => this.props.navigateBack(0)} link>{this.props.provider.username}</Menu.Item>
            </div>
                {this.props.navigation.path.map((dir, i) => {
                return <div key={i}>
                    <Menu.Item link onClick={() => this.props.navigateBack(i + 1)}>{dir}</Menu.Item>
                </div>;
            })}
        </Menu.Menu>;
    }
}

const NavigationComponent = connect(store => {
    return {
        provider: store.provider,
        navigation: store.navigation
    };
})(Navigation);

export default NavigationComponent;