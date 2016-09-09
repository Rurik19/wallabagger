///<reference path="../../typings/index.d.ts" />
import * as React from "react";
import { connect } from "react-redux";
import * as H from "./helpers";
import * as Actions  from "../actions";
import * as Tootips from "../constants/tooltips";

interface ITitleProps extends React.Props<any> {
    title: string;
    helpMode: boolean;
    onClick: () => void;
}

interface ITitleEditProps extends React.Props<any> {
    title: string;
    Save: (title: string) => void;
    Cancel: () => void;
}

interface ITitleEditState {
    title: string;
}

interface ITitlePackState {
    editMode: boolean;
    helpMode: boolean;
    title: string;
    onSaveClick: () => void;
    onCancelClick: () => void;
    onClick: () => void;
}


const Title = ({title = "test title", helpMode = false, onClick = null}: ITitleProps) =>
        <H.Tooltip tooltip={ helpMode ? Tootips.TITLE_TOOLTIP : ""}><H.Clickable onClick = { onClick }><H.BigBlue>
        {title}
    </H.BigBlue></H.Clickable></H.Tooltip>;

class TitleEdit extends React.Component<ITitleEditProps, ITitleEditState> {
constructor(props: ITitleEditProps) {
    super(props);
    this.state = {title: props.title};
    }
    titleChange(e: Event) {
        this.setState( { title: (e.target as HTMLTextAreaElement).value } );
    }
    saveClick() {
        const { Save } = this.props;
        Save(this.state.title);
    }
    render() {
        const { title, Cancel } = this.props;
        return <div>
            <H.Text value={ this.state.title } onChange = { this.titleChange.bind(this) } ></H.Text>
            <H.ButtonLink onClick={ this.saveClick.bind(this)} >Save</H.ButtonLink>
            <H.ButtonLink onClick={Cancel}>Cancel</H.ButtonLink>
        </div>;
    }
}

function mapStateToPropsTitle (state: any) {
    return {
        editMode: state.editMode,
        helpMode: state.helpMode,
        title: state.article.title
    };
};

function mapDispatchToPropsTitle (dispatch: any) {
    return {
    onCancelClick: () => { dispatch(Actions.toggleEditMode()); },
    onSaveClick: (title: string) => { dispatch(Actions.setTitle(title)); },
    onClick: () => { dispatch(Actions.gotoArticlePage()); }
        };
}

const TitlePck = ({
    editMode= false,
    helpMode= false,
    title= "",
    onSaveClick= null,
    onCancelClick= null,
    onClick = null
}: ITitlePackState) =>  {
   return editMode
        ? <TitleEdit title = { title } Save = {onSaveClick} Cancel = {onCancelClick} />
        : <Title title= { title } helpMode={helpMode} onClick={ onClick }/>;
};

const TitlePack = connect(mapStateToPropsTitle, mapDispatchToPropsTitle)(TitlePck);

export { TitlePack };        