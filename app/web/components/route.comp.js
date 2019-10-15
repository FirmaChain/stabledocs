import React from 'react';
import { Route } from 'react-router';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { showLoading, hideLoading} from "../../common/actions"
import queryString from 'query-string';
import history from "../history"
import translate from "../../common/translate"

class _HigherComponent extends React.Component {
  constructor(){
    super()
    this.state = {
      loading:true
    }
  }
  
  componentDidMount() {
    this.event_func(this.props.onEnter,this.props);
  }

  componentWillReceiveProps(nextProps) {
    const { location, match } = this.props.routerProps;
    const { location: nextLocation, match: nextMatch } = nextProps.routerProps;
    if (match.path !== nextMatch.path) {
      this.event_func(nextProps.onEnter, nextProps);
    } else if (location !== nextLocation) {
      this.event_func(this.props.onEnter, nextProps, this.props);
    }
  }

  componentWillUnmount() {
    this.props.onLeave(this.props);
  }

  event_func(f,...props){
    let resp = f(...props)
    if( resp instanceof Promise ){
      this.setState({loading:true})
      this.props.onLoading(true)
      resp.then((ret)=>{
        this.props.onLoading(false).then(()=>{
          if(ret === false) return 
          this.setState({loading:false, resolve:ret})
        })
      }).catch((url)=>{
        history.push(url)
      })
    }else{
      if(resp === false) return 
      this.setState({loading:false, resolve:resp})
    }
  }  

  render() {
    const { component: Component, render: Render, routerProps } = this.props;
    routerProps.location.query = queryString.parse(routerProps.location.search);

    if (Component) {
      if(this.state.loading)
        return <div className="main-loading">LOADING...</div>

      return <Component {...routerProps} resolve={this.state.resolve} />;
    }
    return <Render {...routerProps} />;
  }
}

_HigherComponent.propTypes = {
  component: PropTypes.func,
  render: PropTypes.func,
  routerProps: PropTypes.shape({
    match: PropTypes.object,
    history: PropTypes.object,
    location: PropTypes.object,
  }).isRequired,
  onEnter: PropTypes.func,
  onChange: PropTypes.func,
  onLeave: PropTypes.func,
};

_HigherComponent.defaultProps = {
  component: null,
  render: null,
  onEnter: () => {},
  onChange: () => {},
  onLeave: () => {},
};

let mapDispatchToProps = (dispatch) => {
    return {
        onLoading: (show) => show?dispatch(showLoading()) : dispatch(hideLoading()),
    }
}
let HigherComponent = connect(null,mapDispatchToProps)(_HigherComponent)


const RouteHook = ({
  path,
  exact,
  strict,
  ...rest
}) => (
  <Route
    path={path}
    exact={exact}
    strict={strict}
    render={routerProps => <HigherComponent routerProps={routerProps} {...rest} />}
  />
);

RouteHook.propTypes = {
  path: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]).isRequired,
  exact: PropTypes.bool,
  strict: PropTypes.bool,
};

RouteHook.defaultProps = {
  exact: false,
  strict: false,
};

export default RouteHook;