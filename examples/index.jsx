import PropTypes from "prop-types";
export function Test(props) {
  let { school: schoolAlias = "schoolName", info = { name: "test" }, age = 33, students = [] } = props;
  if(info.year === 2020){
    console.log("will generate year type as number");
  }
  // support deep find
  let childInfo = info.child.info;
  // support null js null propagation
  return <div onClick={() => props?.onClick()}>
    {students.map((student, index) =><div key={index}>{item.name}</div>)}
  </div>
}

Test.propTypes = {
  age: PropTypes.number,
  info: PropTypes.shape({
    child: PropTypes.shape({
      info: PropTypes.any
    }),
    name: PropTypes.string,
    year: PropTypes.number
  }),
  onClick: PropTypes.func,
  school: PropTypes.string,
  students: PropTypes.array
}
