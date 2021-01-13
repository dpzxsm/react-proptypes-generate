import PropTypes from "prop-types";
export function Test(props) {
  let { school: schoolAlias = "schoolName", info = { name: "test" }, age = 33, students = [] } = props;
  if(info.year === 2020){
    console.log("will generate year type as number");
  }
  let childInfo = info.child.info;
  return <div onClick={() => props?.onClick()}>
    {students.map((student, index) =><div key={index}>{item.name}</div>)}
  </div>
}

Test.propTypes = {
  age: PropTypes.number.isRequired, // age
  info: PropTypes.shape({  // error in info
    child: PropTypes.shape({
      info: PropTypes.any // info.child.info
    }),
    name: PropTypes.string,
    year: PropTypes.number // info.year
  }).isRequired, // info
  onClick: PropTypes.func.isRequired,
  school: PropTypes.string.isRequired,
  students: PropTypes.array.isRequired // students
}
