import PropTypes from 'prop-types';
export default class Test extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      title: props.title,
      age: props.age
    };
  }
  render() {
    let { school = "schoolName", info = { name: 2 } } = this.props;
    return <div info={this.props.info}>
      {this.props.name}
    </div>
  }
}

Test.defaultProps = {
  age: 22,
  name: "suming",
  title: "hello world"
};


// const PropTypes = require("prop-types");
// export function Test({clip =1, dd}) {
//   return (
//     <div className="player">
//     </div>
//   );
// }

// const Test = () => <div title ={props.title}/>;


// Test.propTypes = {
//   clip: PropTypes.number,
//   dd: PropTypes.any
// }







