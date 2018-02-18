import React from "react";
import { connect } from "react-redux";
import { Container, Form } from "semantic-ui-react";
import { editText } from "../../store/actions/text-viewer";

class TextViewer extends React.Component {
    render() {
        const textViewerNormalMode = <pre>{this.props.textViewer.text}</pre>;

        const textViewerEditMode = <Form>
            <Form.TextArea onChange={event => this.props.editText(event.target.value)} value={this.props.textViewer.editedText} />
        </Form>;

        return <Container>
            {
                (this.props.textViewer.editMode) ?
                    textViewerEditMode : textViewerNormalMode
            }
        </Container>;
    }
}

const TextViewerComponent = connect(store => {
    return {
        textViewer: store.textViewer
    };
}, { editText })(TextViewer);

export default TextViewerComponent;