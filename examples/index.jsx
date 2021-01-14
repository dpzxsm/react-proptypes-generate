import PropTypes from "prop-types";
export function Test(props) {
  let { school: schoolAlias = "schoolName", info = { name: "test" }, age = 33, students } = props;
  let childInfo = info.child.info;
  return <div onClick={() => props?.onClick()}>
  </div>
}
