/**
* SinriScoreDrawer
* -----------------------
* Load from score text to display numbered musical notation on a canvas element.
	var SSD=new SinriScoreDrawer('myCanvas');
	var textarea=SSD.E('ta');
	var the_score_data=SSD.parseScoreString(textarea.value);
	SSD.loadScoreData(the_score_data,{width:30,height:50});
* For debug, you can get the notes in the format of JSON Array with this
	var the_score_data=SSD.parseScoreString(textarea.value);
*/

if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };	
}

function SinriScoreDrawer(canvas_id){
	// Helper
	this.helper={
		E:function(id){
			return document.getElementById(id);
		},
		INC:function(obj,delta){
			if(!obj){
				obj=0;
			}
			return obj+delta;
		},
		NUM_SCALE:function(number_in_old_scale,old_scalue,new_scale){
			return number_in_old_scale/old_scalue*new_scale;
		},
		LAST_OBJ_OF_ARRAY:function(array){
			if(!array){
				return false;
			}
			if(array.length===0){
				return null;
			}
			return array[array.length-1];
		},
		PARSE_TO_DATA_URL:function(score_text){
			let tmp_canvas_id='SinriScoreDrawer_TMP_CANVAS_OF_'+(new Date().getTime());
			let tmp_canvas=document.createElement('canvas');
			tmp_canvas.setAttribute('id',tmp_canvas_id);
			document.body.insertAdjacentElement('beforeend',tmp_canvas);

			let SSD=new SinriScoreDrawer(tmp_canvas_id);
			let the_score_data=SSD.parseScoreString(score_text);
			SSD.loadScoreData(the_score_data,{width:30,height:50});
			let result = SSD.toDataUrl();

			tmp_canvas.remove();//see above Polyfill code

			return result;
		},
		DOWNLOAD_URL:function(url){
			let a = document.createElement('a');
			let filename = 'SinriScoreDrawer_Untitled.png';
			a.href = url;
			a.download = filename;
			a.click();
			window.URL.revokeObjectURL(url);
		}
	}
	
	// Canvas
	this.toDataUrl=function(){
		return this.canvas.toDataURL();
	}
	this.setStrokeStyle=function(style){
		this.canvas.getContext("2d").strokeStyle = style;
	}
	this.setFillStyle=function(style){
		this.canvas.getContext("2d").fillStyle = style;
	}
	this.drawLine=function(point_start,point_end){
		var ctx = this.canvas.getContext("2d");
		ctx.beginPath();
		ctx.moveTo(point_start[0],point_start[1]);
		ctx.lineTo(point_end[0],point_end[1]);
		ctx.closePath();
		ctx.stroke();
	}
	this.drawPolygon=function(points){
		if(!points||points.length<=2){
			return false;
		}
		var ctx = this.canvas.getContext("2d");
		ctx.beginPath();
		var sp=points[0];
		ctx.moveTo(sp[0],sp[1]);
		for(let i=1;i<points.length;i++){
			var ep=points[i];
			ctx.lineTo(ep[0],ep[1]);
		}
		ctx.closePath();
		ctx.stroke();
	}
	this.drawCircle=function(point_center,radius,method){
		var ctx = this.canvas.getContext("2d");
		ctx.beginPath();
		ctx.arc(point_center[0],point_center[1],radius,0,2*Math.PI);
		ctx.closePath();
		if(method==='fill'){
			ctx.fill();
			return;
		}
		ctx.stroke();
	}
	this.drawDot=function(point_center,radius){
		this.drawCircle(point_center,radius,'fill');
	}
	this.drawArcForKeep=function(point_start_x,point_end_x,point_y,omega,triplets){
		var ctx = this.canvas.getContext("2d");
		var point_start=[point_start_x,point_y];
		var point_end=[point_end_x,point_y];
		var delta_y=0;
		
		var delta_x=(point_end_x-point_start_x)/4.0;
		delta_y=omega*0.8;
		ctx.moveTo(point_start[0], point_start[1]);
		ctx.bezierCurveTo(
			point_start_x+delta_x, point_y-delta_y, 
			point_end_x-delta_x, point_y-delta_y, 
			point_end_x, point_y
		);
		ctx.stroke();

		if(triplets){
			this.writeText('3',[(point_start_x+point_end_x)/2,point_y-delta_y*0.3],{
				font:''+omega*1.5+'px monospace',
				// textAlign:'center',//这里不知道为啥
				textBaseline:'middle'
			});
		}
	}
	this.writeText=function(text,point_base,requirements){
		var ctx = this.canvas.getContext("2d");
		ctx.font = "30px Arial";
		if(requirements){
			if(requirements.font)ctx.font=requirements.font;
			if(requirements.textAlign)ctx.textAlign=requirements.textAlign;
			if(requirements.textBaseline)ctx.textBaseline=requirements.textBaseline;
		}
		if(requirements && requirements.stroke){
			ctx.strokeText(text,point_base[0],point_base[1]);
			return;
		}

		ctx.fillText(text,point_base[0],point_base[1]);		
	}
	// 按照编译完的对象制图
	/**
	 * @param score_data as array
	 */
	this.loadScoreData=function(score_data,cell_size,no_auto_canvas_size){
		let score_size=this.getScoreSize(score_data);

		let s=40,ss=40,k=24,kk=24;

		//default config
		{
			let inner_function_1=function(a,b){
				return parseInt(Math.floor(1.0*a/b),10);
			}
			// let s_from_h=parseInt(Math.floor(1.0*this.canvas.height/score_size.h),10);
			// let s_from_w=parseInt(Math.floor(1.0*this.canvas.width/score_size.w),10);

			let s_from_h=inner_function_1(this.canvas.height,score_size.h);
			let s_from_w=inner_function_1(this.canvas.width,score_size.w);

			s=Math.min(s_from_w,s_from_h);
			k=parseInt(Math.floor(s*0.6),10);
			ss=s;
			kk=k;
		}
		if(cell_size && cell_size.width && cell_size.height){
			ss=cell_size.width;
			s=cell_size.height;
			k=parseInt(Math.floor(s*0.6),10);
			kk=parseInt(Math.floor(ss*0.6),10);

			//modify canvas
			if(!no_auto_canvas_size){
				this.canvas.height=score_size.h*s;
				this.canvas.width=score_size.w*ss;
			}
		}

		let entire_offset={
			x:parseInt(Math.floor((1.0*this.canvas.width-ss*(score_size.w))/2),10),
			y:0
		};

		for(let y=0;y<score_size.h-2;y++){
			let score_line=score_data[y];
			this.keep_sign_set=[];
			for(let x=0;x<score_size.w-2;x++){
				if(score_line[x]){
					// let t=parseInt(Math.floor((s-k)/2.0),10);//char outside space height
					// let tt=parseInt(Math.floor((ss-kk)/2.0),10);//char outside space width
					this.printOneScoreCell({
						s:s,//cell's total height
						k:k,//char area height
						ss:ss,//cell's total width
						kk:kk,//char area width
						cell_offset_x:(entire_offset.x+ss*x+ss),
						cell_offset_y:(s*y+s),
						score_size:score_size,
						t:parseInt(Math.floor((s-k)/2.0),10),
						tt:parseInt(Math.floor((ss-kk)/2.0),10)
					},score_line[x]);
				}
			}
			for(let keep_index=0;keep_index<this.keep_sign_set.length;keep_index++){
				let keep_info=this.keep_sign_set[keep_index];
				if(keep_info && keep_info.start && keep_info.end){
					this.drawArcForKeep(
						keep_info.start.x,
						keep_info.end.x,
						Math.min(keep_info.start.y,keep_info.end.y),
						(keep_info.end.x-keep_info.start.x)*0.2,//0.2 as ori
						(keep_info.start.triplets?true:false)
					);
				}
			}
		}
	}
	this.getScoreSize=function(score_data){
		var h=score_data.length+2;
		var w=0;
		for(let i=0;i<score_data.length;i++){
			if(score_data[i].length>w){
				w=score_data[i].length;
			}
		}
		w+=2;
		return {h:h,w:w};
	}
	this.getCertainPointOfCell=function(cell_attr,type){
		let p_x=0.5,p_y=0.5;
		if(type==='center_of_cell'){
			p_x=0.5;
			p_y=0.5;
		}
		if(type==='score_dot'){
			p_x=0.8;
			p_y=0.5;
		}
		if(type==='SFN'){
			p_x=0.05;
			p_y=0.25;
		}
		return [
			cell_attr.cell_offset_x+cell_attr.ss*p_x,
			cell_attr.cell_offset_y+cell_attr.t+cell_attr.k*p_y
		];
	}
	this.debugDrawCellBorder=function(cell_attr){
		this.setStrokeStyle("lightblue");
		this.drawPolygon([
			[cell_attr.cell_offset_x,cell_attr.cell_offset_y],
			[cell_attr.cell_offset_x+cell_attr.ss,cell_attr.cell_offset_y],
			[cell_attr.cell_offset_x+cell_attr.ss,cell_attr.cell_offset_y+cell_attr.s],
			[cell_attr.cell_offset_x,cell_attr.cell_offset_y+cell_attr.s]
		]);
		this.setStrokeStyle("lightgray");
		this.drawPolygon([
			[cell_attr.cell_offset_x+cell_attr.tt,cell_attr.cell_offset_y+cell_attr.t],
			[cell_attr.cell_offset_x+cell_attr.tt+cell_attr.kk,cell_attr.cell_offset_y+cell_attr.t],
			[cell_attr.cell_offset_x+cell_attr.tt+cell_attr.kk,cell_attr.cell_offset_y+cell_attr.t+cell_attr.k],
			[cell_attr.cell_offset_x+cell_attr.tt,cell_attr.cell_offset_y+cell_attr.t+cell_attr.k]
		]);
	}
	this.printOneScoreCell=function(cell_attr,score,show_cell_border){
		if(show_cell_border){
			this.debugDrawCellBorder(cell_attr);
		}	
		this.setStrokeStyle("black");
		this.setFillStyle("black");

		if(typeof score === 'string'){
			this.printOneScoreCellWithPureString(cell_attr,score[0]);
		}else{
			this.printOneScoreCellWithObject(cell_attr,score);
		}
	}
	this.printOneScoreCellWithPureString=function(cell_attr,score){
		this.writeText(
			score,
			this.getCertainPointOfCell(cell_attr,'center_of_cell'),
			{
				font:''+(Math.min(cell_attr.k,cell_attr.kk))+'px sans-serif',
				textAlign:'center',
				textBaseline:'middle'
			}
		);
	}
	this.printOneScoreCellWithObject=function(cell_attr,score){
		//note
		this.printOneScoreCellWithObjectForText(cell_attr,score);

		// SFND
		this.printOneScoreCellWithObjectForSFN(cell_attr,score);

		//upper part
		let upper_y=this.printOneScoreCellWithObjectForUpper(cell_attr,score);

		//under part
		let underline_y=this.printOneScoreCellWithObjectForUnder(cell_attr,score);

		//keep
		this.printOneScoreCellWithObjectForKeep(cell_attr,score,upper_y);
	}
	this.printOneScoreCellWithObjectForText=function(cell_attr,score){
		let note_text='';
		if(score.note){
			note_text=score.note[0];
		}
		if(score.special_note){
			let mp={
				'REPEAT_START_DOUBLE':"‖:",
				'REPEAT_END_DOUBLE':":‖",
				'REPEAT_START_SINGLE':"|:",
				'REPEAT_END_SINGLE':":|",
				'LONGER_LINE':"ー",
				'FIN':"‖",
				'PHARSE_FIN':"|"
			}
			if(score.special_note==='AS_IS' && score.note){
				note_text=score.note;
			}else if(mp[score.special_note]){
				note_text=mp[score.special_note];
			}
		}
		this.writeText(
			note_text,
			this.getCertainPointOfCell(cell_attr,'center_of_cell'),
			{
				font:''+(Math.min(cell_attr.k,cell_attr.kk))+'px sans-serif',
				textAlign:(score.title?'left':'center'),
				textBaseline:'middle'
			}
		);
	}
	this.printOneScoreCellWithObjectForSFN=function(cell_attr,score){
		let sfn_char='';
		if(score.sharp){
			sfn_char='♯';
		}else if(score.flat){
			sfn_char='♭';
		}else if(score.natual){
			sfn_char='♮';
		}
		if(sfn_char!==''){
			this.writeText(
				sfn_char,
				this.getCertainPointOfCell(cell_attr,'SFN'),
				{
					font:''+(0.8*Math.min(cell_attr.k,cell_attr.kk))+'px sans-serif',
					textAlign:'center',
					textBaseline:'middle'
				}
			);
		}

		if(score.dot){
			this.drawDot(
				this.getCertainPointOfCell(cell_attr,'score_dot'),
				this.helper.NUM_SCALE(2,30,cell_attr.ss) // 2
			);
		}
	}
	this.printOneScoreCellWithObjectForUpper=function(cell_attr,score){
		let upper_y=cell_attr.cell_offset_y+cell_attr.t;

		//upper points
		let upperpoints=score.upperpoints;
		if(upperpoints && upperpoints>0){
			upper_y=upper_y-this.helper.NUM_SCALE(1,50,cell_attr.s);
			for(let i=0;i<upperpoints;i++){
				this.drawDot(
					[cell_attr.cell_offset_x+cell_attr.ss/2,upper_y],
					this.helper.NUM_SCALE(2,30,cell_attr.ss) //2
				);
				upper_y=upper_y-this.helper.NUM_SCALE(6,50,cell_attr.s);
			}
		}

		if(score.fermata){// /.\
			this.drawArcForKeep(
				cell_attr.cell_offset_x+cell_attr.ss*0.1,
				cell_attr.cell_offset_x+cell_attr.ss*0.9,
				upper_y-this.helper.NUM_SCALE(3,50,cell_attr.s),
				cell_attr.ss*0.9*0.2
			);
			this.drawDot(
				[cell_attr.cell_offset_x+cell_attr.ss/2,upper_y],
				this.helper.NUM_SCALE(2,30,cell_attr.ss)
			);
			upper_y=upper_y-this.helper.NUM_SCALE(6,50,cell_attr.s);
		}

		if(score.effect_word){
			this.writeText(
				score.effect_word,
				[cell_attr.cell_offset_x+cell_attr.ss*0.1,upper_y-this.helper.NUM_SCALE(9,50,cell_attr.s)],
				{
					font:'italic '+(Math.min(cell_attr.k,cell_attr.kk)*0.6)+'px sans-serif',
					textAlign:'left',
					textBaseline:'middle'
				}
			);
			upper_y=upper_y-this.helper.NUM_SCALE(6,50,cell_attr.s);
		}

		return upper_y;
	}
	this.printOneScoreCellWithObjectForUnder=function(cell_attr,score){
		let underline_y=cell_attr.cell_offset_y+cell_attr.t+cell_attr.k+3;

		//under lines
		let underlines=(score.underlines?parseInt(score.underlines,10):0);
		if(score.triplets){
			underlines=1;
		}
		for(let i=0;underlines>0 && i<underlines;i++){
			this.drawLine(
				[cell_attr.cell_offset_x,underline_y],
				[cell_attr.cell_offset_x+cell_attr.ss,underline_y]
			);
			underline_y=underline_y+this.helper.NUM_SCALE(3,50,cell_attr.s);
		}
		//under points
		let underpoints=(score.underpoints?parseInt(score.underpoints,10):0);
		underline_y=underline_y+this.helper.NUM_SCALE(1,50,cell_attr.s);
		for(let i=0;underpoints>0 && i<underpoints;i++){
			this.drawDot(
				[cell_attr.cell_offset_x+cell_attr.ss/2,underline_y],
				this.helper.NUM_SCALE(2,30,cell_attr.ss)
			);
			underline_y=underline_y+this.helper.NUM_SCALE(6,50,cell_attr.s);
		}

		return underline_y;
	}
	this.printOneScoreCellWithObjectForKeep=function(cell_attr,score,upper_y){
		let triplets=(score.triplets?score.triplets:false);
		let s_or_e='';
		if(score.keep_start){
			s_or_e='start';
		}else if(score.keep_end){
			s_or_e='end';
		}

		let last_sign_item=this.helper.LAST_OBJ_OF_ARRAY(this.keep_sign_set);

		if(
			last_sign_item && !last_sign_item.end
		){
			last_sign_item[s_or_e]={
				x:cell_attr.cell_offset_x+cell_attr.ss*0.5,
				y:upper_y,
				triplets:triplets
			};
			return;
		}
		if(score.keep_start){
			this.keep_sign_set.push({
				start:{
					x:cell_attr.cell_offset_x+cell_attr.ss*0.5,
					y:upper_y,
					triplets:triplets
				}
			});
			return;
		}		
	}
	//////
	/**
	 * RULE SET
	 * 0. Accept chars which can match regex [A-Za-z0-9\-\.\_\^\|\:\ \r\n\*\/\>] 
	 * 1. Each line should be seperated by one or more RETURNs: [\r\n]+
	 * 2. Each note should be seperated by one or more SPACEs: [ ]+
	 * 3. Line begin with ~, full line use AS_IS mode 
	 * 4. Line begin with >, line is lyrics,use  
	 * 5. A 1/4 note is a char of [0-7], with < for lower and > for higher
	 * 6.1 For longer note, use NOTE*X: \*[1-9][0-9]* to describe X-times of length
	 * 6.2 For longer note, use [\-]+ to simply memo it, such as 1- or 1---
	 * 7.1 For shorter note, use NOTE/X: \/[1-9][0-9]* to describe one Xth of length
	 * 7.2 For shorter note, use [\_]+ to simple memo it, such as 1_ or 1__
	 * 8. Attached dot, use one dot \. after NOTE
	 * 9. For pharse, use one \|
	 * 10. For inner repeat, use \|\: and \:\|
	 * 11. For final repeat, use \||\: and \:\|\|
	 * 12. For fin, use \|\|
	 * 13. Sharp and flat
	 */
	this.parseScoreString=function(score_text){
		let score_data=[];
		let lines=score_text.split(/[\r\n]+/);

		let the_notes_list=[];
		let has_numbered_lyric=false;
		for(let line_index=0;line_index<lines.length;line_index++){
			let notes=lines[line_index].trim().split(/[ ]+/);
			
			let type=null;
			let first_note_char=notes[0];
			if(first_note_char==='~'){
				type='TITLE';
				let title=(notes.shift() ? notes.join(' ') : lines[line_index]);
				notes=[title];
			}
			else if(first_note_char==='>'){
				type='LYRIC';
				notes=lines[line_index].slice(2).split('');
				// alert(notes);
			}
			else if(first_note_char==='#'){
				type='NUMBERED_LYRIC';
				notes=lines[line_index].slice(2).split('');
				has_numbered_lyric=true;
				// alert(notes);
			}
			else if(first_note_char==='@'){
				type='ALL_LYRIC';
				notes=lines[line_index].slice(2).split('');
				has_numbered_lyric=true;
				// alert(notes);
			}
			// old
			// let line_data=this.parseScoreLineString(notes,type);
			// score_data.push(line_data);
			//new 
			the_notes_list.push({notes:notes,type:type});
		}
		let number=0;
		for(let i=0;i<the_notes_list.length;i++){
			let notes=the_notes_list[i].notes;
			let type=the_notes_list[i].type;
			if(has_numbered_lyric){
				if(!type || type==='LYRIC'){
					notes=[' '].concat(notes);
				}else if(type==='ALL_LYRIC'){
					notes=['和'].concat(notes);
				}else if(type==='NUMBERED_LYRIC'){
					number=number+1;
					notes=[
					number // {note:number,special_note:'AS_IS'}
					].concat(notes);
				}
			}
			let line_data=this.parseScoreLineString(notes,type);
			score_data.push(line_data);
		}
		return score_data;
	}
	this.parseScoreLineString=function(notes,type){
		let line_data=[];
		for(let note_index=0;note_index<notes.length;note_index++){
			let note_results=this.parseNoteString(notes[note_index],type);
			// console.log("PARSE",notes[note_index],JSON.stringify(note_results));
			for(let i=0;i<note_results.length;i++){
				line_data.push(note_results[i]);
			}
		}
		return line_data;
	}
	this.parseNoteString=function(note_text,type){
		if(type){
			return this.parseNoteStringWithType(note_text,type);
		}

		let control_sign_note=this.parseNoteStringForControlSign(note_text);
		if(control_sign_note){
			return control_sign_note;
		}

		//ELSE
		let regex=/^[\(]?[#bn]?([0]|([1-7](\<|\>)*))[~]?((\.)|(\.?_+)|(\-+)|(\*[1-9][0-9]*)|(\/[1-9][0-9]*))?[\)]?(:[A-Z]+)?$/;
		if(!regex.test(note_text)){
			return [{
				special_note:'AS_IS',
				note:note_text
			}]
		}

		let note={
			_has_long_line:0,
			_times_divided:0,
			_times_multiply:0
		};
		let flag=0;//beginning

		let parts=note_text.split(':');
		if(parts[1] && this.NoteEffectWordDictory[parts[1]]){
			note.effect_word=this.NoteEffectWordDictory[parts[1]];
		}
		note_text=parts[0];

		for(let i=0;i<note_text.length;i++){
			let c=note_text[i];
			flag=this.parseNoteStringForNotation(c,flag,note);
		}

		return this.parseNoteStringForNotationAddition(note);
	}
	this.parseNoteStringWithType=function(note_text,type){
		if(type==='TITLE'){
			return [{
				special_note:'AS_IS',
				note:note_text,
				title:true
			}];
		}
		else if(type==='LYRIC'){
			return [{
				special_note:'AS_IS',
				note:note_text
			}];
		}
		// IF NOT DETERMINED
		return [{
			special_note:'AS_IS',
			note:note_text
		}];
	}
	this.parseNoteStringForControlSign=function(note_text){
		let mp={
			'||:':'REPEAT_START_DOUBLE',
			':||':'REPEAT_END_DOUBLE',
			'|:':'REPEAT_START_SINGLE',
			':|':'REPEAT_END_SINGLE',
			'||':'FIN',
			'|':'PHARSE_FIN'
		}
		if(mp[note_text]){
			return [{special_note:mp[note_text]}];
		}

		return false;
	}
	this.parseNoteStringForNotation=function(c,flag,note){
		if(c==='(' && flag===0){
			note.keep_start=true;
			flag=1;//has keep_start
		}else if(c==='#' && flag<=1){
			note.sharp=true;
			flag=2;//has sharp/flat
		}else if(c==='b' && flag<=1){
			note.flat=true;
			flag=2;//has sharp/flat
		}else if(c==='n' && flag<=1){
			note.natual=true;
			flag=2;//has sharp/flat
		}else if(c>='0' && c<='9'){
			if(flag<=2){
				note.note=c;
				flag=3;//has note
			}else if(flag===7){
				note._times_multiply=note._times_multiply*10+1*c;
			}else if(flag===8){
				note._times_divided=note._times_divided*10+1*c;
			}
		}else if(c==='<' && flag===3){
			note.underpoints=this.helper.INC(note.underpoints,1);
		}else if(c==='>' && flag===3){
			note.upperpoints=this.helper.INC(note.upperpoints,1);
		}else if(c==='.' && flag===3){
			note.dot=true;
			flag=4;//has dot
		}else if(c==='_' && (flag===3 || flag===4 || flag===5)){
			note.underlines=this.helper.INC(note.underlines,1);
			flag=5;//has underlines
		}else if(c==='-' && (flag===3 || flag===6)){
			note._has_long_line+=1;
			flag=6;//has long line
		}else if(c==='*' && (flag===3 || flag===7)){
			flag=7;
		}else if(c==='\/' && (flag===3 || flag===8)){
			flag=8;
		}else if(c===')' && flag>3){
			note.keep_end=true;
			flag=9;
		}else if(c==='~' && flag===3){
			note.fermata=true;
		}
		return flag;
	}
	this.parseNoteStringForNotationAddition=function(note){
		if(note._times_multiply>0){
			note._has_long_line=note._times_multiply-1;
		}
		if(note._times_divided>0){
			if(note._times_divided===3){
				note.triplets=true;
			}
			else if(note._times_divided%2===0){
				note.underlines=note._times_divided/2;
			}
			else{
				note.underlines=Math.floor(note._times_divided/2);
				note.dot=true;
			}
		}

		let has_long_line=note._has_long_line;
		delete note._has_long_line;
		delete note._times_divided;
		delete note._times_multiply;

		let notes=[note];
		for(let j=0;j<has_long_line;j++){
			notes.push({
				special_note:'LONGER_LINE'
			});
		}

		return notes;
	}
	this.NoteEffectWordDictory={
		"F":'f',
		"FF":'ff',
		"P":'p',
		"PP":'pp',
		"MP":"mp",
		"MF":"mf",
		"POCO":"poco",
		"DIM":"dim...",
		"CRES":"cres...",
		"RIT":"rit...",
		"RALL":"rall...",
		"ATEMPO":"a tempo",
		"VF":">"
	}


	// initialize
	if(!canvas_id){
		return this;
	}
	this.canvas=this.helper.E(canvas_id);
}