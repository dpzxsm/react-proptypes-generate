// import PropTypes from 'prop-types2'
// import PropTypes from 'prop-types'
// const PropTypes = require('prop-types2');
// export default class Test extends PureComponent {
//   constructor(props) {
//     super(props);
//     this.state = {
//       title: props.title,
//       age: props.age
//     };
//   }
//   render() {
//     let { school = "schoolName" , info = { name: 2 }} = this.props;
//     return <div info={this.props.info}>
//       {this.props.name}
//     </div>
//   }
// }

const PropTypes = require("prop-types");
export function Test({clip =1, dd}) {
  return (
    <div className="player">
    </div>
  );
}

Test.propTypes = {
  clip: PropTypes.number,
  dd: PropTypes.any
}






