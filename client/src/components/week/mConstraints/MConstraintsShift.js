import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AppContext,ManagerContext,WeekContext } from '../../../App';
import MConstraintsOption from './MConstraintsOption';
import '../Week.css';
import { Input, TextField, Stack } from '@mui/material';
import {getShiftId, getDateString} from '../../../utils/week_utils';
import { shiftsTime } from '../../../config/shiftsConfig';
import './MConstraints.css';


const MConstraintsShift = (props) => {

    const { part, date, handleClick } = props;
    const { users, usersObj } = useContext(AppContext);
    const { constraintsObj, scheduleObj} = useContext(WeekContext);

    const [shiftId] = useState(getShiftId(date,part));
    const [defaultTime] = useState({
        start_at:shiftsTime[part].start_at,
        end_at:shiftsTime[part].end_at
    })
    const [time, setTime] = useState(defaultTime);
    const [selected, setSelected] = useState({
        user_id:null,
        name: null,
        color:null,
    });
    const [constraints, setConstraints]= useState(null);
   

    const initConstraints = ()=>{
        const constraints = {};
        const options = ['favorite','open','unselected','close'];
        options.forEach(option=>constraints[option]=[])
        for(const user of users){
            const id = user.id+shiftId;
            const row = constraintsObj[id]
            if(row){
                const option = row.option || 'unselected';
                const {user_id,note} = row; 
                // console.log("option,constraints[option]=>",option,constraints[option]);
                constraints[option].push({user_id,note});
            }else{
                constraints.unselected.push({user_id:user.id,note:null})
            }
        }
        console.log(constraints);
        setConstraints(constraints)
    }

    const initSchedule = ()=>{
        if(scheduleObj[shiftId]){
            const {user_id,start_at,end_at} = scheduleObj[shiftId]
            const {name, color} = usersObj[user_id || 'empty']; 
            setSelected({user_id,name,color});
            setTime({start_at,end_at});
        }
    }

    const setTimeStyle = (timeKey,timeVal)=>{
        const defaultStyle = {
                height:20,
                margin:1,
        }
        const changeStyle =  {...defaultStyle,background:'rgb(217, 217, 209)'}
        const match = defaultTime[timeKey]===timeVal;
        // const match = defaultTime[timeKey]===timeVal || `${defaultTime[timeKey]}:00`==`${timeVal}`
        // console.log(defaultTime[timeKey],timeVal, match, );
        return { '& .MuiInputBase-root': match ? defaultStyle : changeStyle} 
        // object for sx property => 
        //{
        //     '& .MuiInputBase-root': {
        //         height:20,
        //         margin:1,
        //         background:'rgb(217, 217, 209)'  // ? optional 
        //       },
        // }      
    }

    const changeTime = (e, key)=>{
        const prevTime = {...time};
        console.log(prevTime);
        const newTime = {...time, [key]:e.target.value};
        setTime(newTime);
        console.log('newTime=>',newTime);
        const {start_at,end_at} = newTime;
        const {user_id} = selected;
        upsertShift(user_id,start_at,end_at)
        .then(res=>{
            if(res==='error'){
                setTime(prevTime);
            }else{
                scheduleObj[shiftId] = res;
            }
        })
        .catch(e=>{
            console.log(e);
            console.log(prevTime);
            
        })
    }

    const onSelect = (user_id)=>{
        const prevSelected = {...selected};
        const {start_at,end_at} = time;
        const {name,color} = usersObj[user_id || 'empty'];
        setSelected({user_id,name,color});
        upsertShift(user_id,start_at,end_at)
        .then(res=>{
            if(res==='error'){
                setSelected(prevSelected)
            }else{
                scheduleObj[shiftId] = res;
                handleClick();
            }
        })
    }

    const upsertShift = async (user_id,start_at,end_at) => {
        const shift = {
            id: shiftId,
            user_id,
            date: getDateString(date),
            day: date.getDay(),
            part, start_at, end_at
        }
        try {
            const response = await axios.post('schedule/upsert', [shift], {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            console.log('upsertSchedule=>', response.data);
            return shift;
        } catch (e) {
            console.log('upsertSchedule error=>', e)
            alert("Couldn't save changes, Please check your conection")
            return 'error'
        }
    }

    useEffect(()=>{
        initConstraints();
        initSchedule();
    },[])
       
        return( 
                constraints ?
               
                <div className={`cell part`} style={{ height: 300 }}>
                {/* <p>{shiftId}</p>
                <p>{scheduleObj[shiftId]?scheduleObj[shiftId].part : ''}</p> */}
                {
                    ['start_at', 'end_at'].map((timeKey,index)=>
                    <TextField className='my-color'
                    sx={setTimeStyle(timeKey, time[timeKey])}
                    key={index} type='time' value={time[timeKey]} onChange={(e)=>changeTime(e,timeKey)} inputProps={{ step: 300 }} />
                    )
                }

                 <h3 className='m_shift_selected' onClick={() => onSelect(null)} style={{ backgroundColor: selected.color }}>{selected.name}</h3>
    
                {
                    ['favorite','open'].map((option, index) => <MConstraintsOption key={index} option={option} employees={constraints[option]} onSelect={onSelect} />)
                }
                <Stack direction="row" spacing={2}>

                    {
                        ['unselected', 'close'].map((option, index) => <MConstraintsOption key={index} option={option} employees={constraints[option]} onSelect={onSelect} />)
                    }

                </Stack> 

            </div>
             
            :
            null
        )
            
       

    }

    export default MConstraintsShift;






      // const { part, data, date, changeOption } = props;
    // const { constraints, schedule, time } = data;
    // const id = schedule.user_id === '' ? 'empty' : schedule.user_id
    // console.log(schedule.user_id==='',id);
        
    // const [start_at, setStart_at] = useState(time.start_at)
    // const [end_at, setEnd_at] = useState(time.end_at)
    // const [fullConstraints, setFullConstraints] = useState(constraints);
    

    


    

    // const { allScheduleData, upsertScheduleData } = useContext(ManagerContext)
    // const activeUsers = users.filter(user => user.active);
    // console.log('usersObj=>',usersObj,'selected=>',selected,'usersObj["empty"].name=>',usersObj['empty'].name,'schedule.user_id=>',schedule.user_id==='');

    // const addNullConstraint = () => {
    //     const exist = [];
    //     for (let option in constraints) {
    //         for (let user of constraints[option]) {
    //             exist.push(user.user_id);
    //         }
    //     }
    //     // console.log('exist=>',exist);
    //     const activeUsersId = activeUsers.map(user => user.id)
    //     const nullUsersId = activeUsersId.filter(user => !exist.includes(user))
    //     // console.log('nullUsersId=>',nullUsersId);
    //     const nullUsers = nullUsersId.map(user => { return { user_id: user, note: null } })
    //     constraints.null.push(...nullUsers)
    //     setFullConstraints(constraints)
    // }

    // const onSelect = (user_id) => {
    //     setSelected(user_id);
    //     handleChange(user_id, start_at, end_at)
    // }

    // const changeStartTime = (e) => {
    //     setStart_at(e.target.value)
    //     handleChange(selected, e.target.value, end_at)
    // }

    // const changeEndTime = (e) => {
    //     setEnd_at(e.target.value)
    //     handleChange(selected, start_at, e.target.value)
    // }


    // const handleChange = (selected, start_at, end_at) => {
    //     console.log('changeOption=>', { part, user_id: selected, start_at, end_at });
    //     changeOption({ part, user_id: selected, start_at, end_at });
    //     upsertShift(selected,start_at,end_at);
    // }

    // const sendWhatsapp = (emp) => {
    //     props.sendWhatsapp(emp, part)
    // }

    // const upsertShift = async (userId,start_at,end_at) => {
    //     const user_id = userId || null
    //     console.log(user_id);
    //     const shift = {
    //         id: shiftId,
    //         user_id,
    //         date: getDateString(date),
    //         day: date.getDay(),
    //         part, start_at, end_at
    //     }
    //     try {
    //         const response = await axios.post('schedule/upsert', [shift], {
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             }
    //         })
    //         console.log('upsertSchedule=>', response.data);
    //     } catch (e) {
    //         console.log('upsertSchedule error=>', e)
    //     }
    // }

    //     useEffect(addNullConstraint, []);



    //     useEffect(() => {
    //         if (usersObj[selected]) {
    //             setColor(usersObj[selected].color)
    //         } else {
    //             setColor('')
    //         }
    //     }, [selected])

        // MuiInputBase-root MuiOutlinedInput-root MuiInputBase-colorPrimary MuiInputBase-formControl css-9ddj71-MuiInputBase-root-MuiOutlinedInput-root

        // MuiInputBase-input MuiOutlinedInput-input css-1t8l2tu-MuiInputBase-input-MuiOutlinedInput-input

        // .css-9ddj71-MuiInputBase-root-MuiOutlinedInput-root