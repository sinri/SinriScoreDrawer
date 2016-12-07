/**
* SinriScoreDrawer
* -----------------------
* Load from score text to display numbered musical notation on a canvas element.
	SinriScoreDrawer.loadScoreData(
		SinriScoreDrawer.E(CANVAS_ID),
		SinriScoreDrawer.parseScoreString(SCORE_TEXT),
		{width:30,height:60}
	);
* For debug, you can get the notes in the format of JSON Array with this
	SinriScoreDrawer.parseScoreString(SCORE_TEXT);
*/
var SinriScoreDrawer={
	E:function(id){
		return document.getElementById(id);
	},
	P:function(x,y){
		return {x:x,y:y};
	},
	/////
	setStrokeStyle:function(canvas,style){
		if(style){
			canvas.getContext("2d").strokeStyle = style;
		}
	},
	setFillStyle:function(canvas,style){
		if(style){
			canvas.getContext("2d").fillStyle = style;
		}
	},
	drawLine:function(canvas,point_start,point_end){
		var ctx = canvas.getContext("2d");
		ctx.beginPath();
		ctx.moveTo(point_start[0],point_start[1]);
		ctx.lineTo(point_end[0],point_end[1]);
		ctx.closePath();
		ctx.stroke();
	},
	drawPolygon:function(canvas,points){
		if(!points||points.length<=2){
			return false;
		}
		var ctx = canvas.getContext("2d");
		ctx.beginPath();
		var sp=points[0];
		ctx.moveTo(sp[0],sp[1]);
		for(var i=1;i<points.length;i++){
			var ep=points[i];
			ctx.lineTo(ep[0],ep[1]);
		}
		ctx.closePath();//ctx.lineTo(sp[0],ep[1]);
		ctx.stroke();
	},
	drawCircle:function(canvas,point_center,radius){
		var ctx = canvas.getContext("2d");
		ctx.beginPath();
		ctx.arc(point_center[0],point_center[1],radius,0,2*Math.PI);
		ctx.closePath();
		ctx.stroke();
	},
	drawDot:function(canvas,point_center,radius){
		var ctx = canvas.getContext("2d");
		ctx.beginPath();
		ctx.arc(point_center[0],point_center[1],radius,0,2*Math.PI);
		ctx.closePath();
		ctx.fill();
	},
	drawArcForKeep:function(canvas,point_start_x,point_end_x,point_y,omega,triplets){
		var ctx = canvas.getContext("2d");
		var point_start=[point_start_x,point_y];
		var point_end=[point_end_x,point_y];

		var keep_method='bezierCurve';
		
		if(keep_method==='arc'){// use arcTo
			var k=point_end_x-point_start_x;
			var r=(4*omega*omega+k*k)/(8*omega);
			var delta_y=r-omega;
			var point_top=[(point_start_x+point_end_x)/2,point_y-delta_y];

			ctx.moveTo(point_start[0], point_start[1]);
			ctx.arcTo(point_top[0],point_top[1],point_end[0],point_end[1],r);
			ctx.stroke();
		}
		else if(keep_method==='bezierCurve'){// use bezierCurveTo
			var delta_x=(point_end_x-point_start_x)/4.0;
			var delta_y=omega*0.8;
			ctx.moveTo(point_start[0], point_start[1]);
			ctx.bezierCurveTo(
				point_start_x+delta_x, point_y-delta_y, 
				point_end_x-delta_x, point_y-delta_y, 
				point_end_x, point_y
			);
			ctx.stroke();
		}

		if(triplets){
			SinriScoreDrawer.writeText(canvas,'3',[(point_start_x+point_end_x)/2,point_y-delta_y*0.3],{
				font:''+omega*1.5+'px monospace',
				// textAlign:'center',
				textBaseline:'middle'
			});
		}
	},
	writeText:function(canvas,text,point_base,requirements){
		var ctx = canvas.getContext("2d");
		ctx.font = "30px Arial";
		if(requirements){
			if(requirements.font)ctx.font=requirements.font;
			if(requirements.textAlign)ctx.textAlign=requirements.textAlign;
			if(requirements.textBaseline)ctx.textBaseline=requirements.textBaseline;
		}
		if(requirements && requirements.stroke){
			ctx.strokeText(text,point_base[0],point_base[1]);
		}else{
			ctx.fillText(text,point_base[0],point_base[1]);
		}
		
	},
	/////
	/**
	 * @param score_data as array
	 */
	loadScoreData:function(canvas,score_data,cell_size){
		var score_size=SinriScoreDrawer.getScoreSize(score_data);

		var s=40,ss=40,k=24,kk=24;

		if(cell_size && cell_size.width && cell_size.height){
			ss=cell_size.width;
			s=cell_size.height;
			k=parseInt(Math.floor(s*0.6),10);
			kk=parseInt(Math.floor(ss*0.6),10);

			//modify canvas
			if(true){
				canvas.height=score_size.h*s;
				canvas.width=score_size.w*ss;
			}

		}else{
			var s_from_h=parseInt(Math.floor(1.0*canvas.height/score_size.h),10);
			var s_from_w=parseInt(Math.floor(1.0*canvas.width/score_size.w),10);
			s=Math.min(s_from_w,s_from_h);
			k=parseInt(Math.floor(s*0.6),10);
			ss=s;
			kk=k;
		}

		var entire_offset={
			x:parseInt(Math.floor((1.0*canvas.width-ss*(score_size.w))/2),10),
			y:0
		};

		for(var y=0;y<score_size.h-2;y++){
			var score_line=score_data[y];
			SinriScoreDrawer.keep_sign_set=[];
			for(var x=0;x<score_size.w-2;x++){
				if(score_line[x]){
					SinriScoreDrawer.printOneScoreCell(canvas,{
						s:s,//cell's total height
						k:k,//char area height
						ss:ss,//cell's total width
						kk:kk,//char area width
						cell_offset_x:(entire_offset.x+ss*x+ss),
						cell_offset_y:(s*y+s),
						score_size:score_size
					},score_line[x]);
				}
			}
			for(var keep_index=0;keep_index<SinriScoreDrawer.keep_sign_set.length;keep_index++){
				var keep_info=SinriScoreDrawer.keep_sign_set[keep_index];
				if(keep_info && keep_info.start && keep_info.end){
					SinriScoreDrawer.drawArcForKeep(
						canvas,
						keep_info.start.x,
						keep_info.end.x,
						Math.max(keep_info.start.y,keep_info.end.y),
						(keep_info.end.x-keep_info.start.x)*0.2,//0.2 as ori
						(keep_info.start.triplets?true:false)
					);
				}
			}
		}
	},
	getScoreSize:function(score_data){
		var h=score_data.length+2;
		var w=0;
		for(var i=0;i<score_data.length;i++){
			if(score_data[i].length>w){
				w=score_data[i].length;
			}
		}
		w+=2;
		return {h:h,w:w};
	},
	printOneScoreCell:function(canvas,cell_attr,score){
		var t=parseInt(Math.floor((cell_attr.s-cell_attr.k)/2.0),10);//char outside space height
		var tt=parseInt(Math.floor((cell_attr.ss-cell_attr.kk)/2.0),10);//char outside space width
		if(!true){
			SinriScoreDrawer.setStrokeStyle(canvas,"lightblue");
			SinriScoreDrawer.drawPolygon(canvas,[
				[cell_attr.cell_offset_x,cell_attr.cell_offset_y],
				[cell_attr.cell_offset_x+cell_attr.ss,cell_attr.cell_offset_y],
				[cell_attr.cell_offset_x+cell_attr.ss,cell_attr.cell_offset_y+cell_attr.s],
				[cell_attr.cell_offset_x,cell_attr.cell_offset_y+cell_attr.s]
			]);
			SinriScoreDrawer.setStrokeStyle(canvas,"lightgray");
			SinriScoreDrawer.drawPolygon(canvas,[
				[cell_attr.cell_offset_x+tt,cell_attr.cell_offset_y+t],
				[cell_attr.cell_offset_x+tt+cell_attr.kk,cell_attr.cell_offset_y+t],
				[cell_attr.cell_offset_x+tt+cell_attr.kk,cell_attr.cell_offset_y+t+cell_attr.k],
				[cell_attr.cell_offset_x+tt,cell_attr.cell_offset_y+t+cell_attr.k]
			]);
		}	
		SinriScoreDrawer.setStrokeStyle(canvas,"black");
		SinriScoreDrawer.setFillStyle(canvas,"black");

		if(typeof score === 'string'){
			SinriScoreDrawer.writeText(
				canvas,score[0],
				[cell_attr.cell_offset_x+cell_attr.ss/2,cell_attr.cell_offset_y+t+cell_attr.k*0.5],
				{
					font:''+(Math.min(cell_attr.k,cell_attr.kk))+'px sans-serif',
					textAlign:'center',
					textBaseline:'middle'
				}
			);
		}else{
			//note
			var note_text='';
			if(score.note){
				note_text=score.note[0];
			}
			if(score.special_note){
				if(score.special_note==='AS_IS' && score.note){
					note_text=score.note;
				}else if(score.special_note==='REPEAT_START_DOUBLE'){
					note_text="‖:";
				}else if(score.special_note==='REPEAT_END_DOUBLE'){
					note_text=":‖";
				}else if(score.special_note==='REPEAT_START_SINGLE'){
					note_text="|:";
				}else if(score.special_note==='REPEAT_END_SINGLE'){
					note_text=":|";
				}else if(score.special_note==='LONGER_LINE'){
					note_text="ー";
				}else if(score.special_note==='FIN'){
					note_text="‖";
				}else if(score.special_note==='PHARSE_FIN'){
					note_text="|";
				}
			}
			if(score.title){
				SinriScoreDrawer.writeText(
					canvas,
					note_text,
					//[cell_attr.cell_offset_x+cell_attr.ss/2,cell_attr.cell_offset_y+t+cell_attr.k*0.5],
					[cell_attr.ss+0*cell_attr.score_size.w*cell_attr.ss/2,cell_attr.cell_offset_y+t+cell_attr.k*0.5],
					{
						font:''+(Math.min(cell_attr.k,cell_attr.kk))+'px sans-serif',
						textAlign:'left',
						textBaseline:'middle'
					}
				);
			}else{
				SinriScoreDrawer.writeText(
					canvas,
					note_text,
					[cell_attr.cell_offset_x+cell_attr.ss/2,cell_attr.cell_offset_y+t+cell_attr.k*0.5],
					{
						font:''+(Math.min(cell_attr.k,cell_attr.kk))+'px sans-serif',
						textAlign:'center',
						textBaseline:'middle'
					}
				);
			}
			

			// sharp ♯ and flat ♭
			if(score.sharp){
				SinriScoreDrawer.writeText(
					canvas,
					'♯',
					[cell_attr.cell_offset_x+cell_attr.ss/2*0.1,cell_attr.cell_offset_y+t+cell_attr.k*0.25],
					{
						font:''+(0.8*Math.min(cell_attr.k,cell_attr.kk))+'px sans-serif',
						textAlign:'center',
						textBaseline:'middle'
					}
				);
			}
			else if(score.flat){
				SinriScoreDrawer.writeText(
					canvas,
					'♭',
					[cell_attr.cell_offset_x+cell_attr.ss/2*0.1,cell_attr.cell_offset_y+t+cell_attr.k*0.25],
					{
						font:''+(0.8*Math.min(cell_attr.k,cell_attr.kk))+'px sans-serif',
						textAlign:'center',
						textBaseline:'middle'
					}
				);
			}else if(score.natual){
				SinriScoreDrawer.writeText(
					canvas,
					'♮',
					[cell_attr.cell_offset_x+cell_attr.ss/2*0.1,cell_attr.cell_offset_y+t+cell_attr.k*0.25],
					{
						font:''+(0.8*Math.min(cell_attr.k,cell_attr.kk))+'px sans-serif',
						textAlign:'center',
						textBaseline:'middle'
					}
				);
			}

			if(score.dot){
				SinriScoreDrawer.drawDot(
					canvas,
					[cell_attr.cell_offset_x+cell_attr.ss*0.8,cell_attr.cell_offset_y+t+cell_attr.k*0.5],
					2
				);
			}

			//upper part

			var upper_y=cell_attr.cell_offset_y+t;

			//upper points
			var upperpoints=score.upperpoints;
			if(upperpoints && upperpoints>0){
				upper_y=upper_y-1;
				for(var i=0;i<upperpoints;i++){
					SinriScoreDrawer.drawDot(
						canvas,
						[cell_attr.cell_offset_x+cell_attr.ss/2,upper_y],
						2
					);
					upper_y=upper_y-6;
				}
			}

			if(score.fermata){// /.\
				SinriScoreDrawer.drawArcForKeep(
					canvas,
					cell_attr.cell_offset_x+cell_attr.ss*0.1,
					cell_attr.cell_offset_x+cell_attr.ss*0.9,
					upper_y-3,
					cell_attr.ss*0.9*0.2
				);
				SinriScoreDrawer.drawDot(
					canvas,
					[cell_attr.cell_offset_x+cell_attr.ss/2,upper_y],
					2
				);
				upper_y=upper_y-6;
			}

			if(score.effect_word){
				SinriScoreDrawer.writeText(
					canvas,
					score.effect_word,
					[cell_attr.cell_offset_x+cell_attr.ss*0.1,upper_y-9],
					{
						font:'italic '+(Math.min(cell_attr.k,cell_attr.kk)*0.6)+'px sans-serif',
						textAlign:'left',
						textBaseline:'middle'
					}
				);
				upper_y=upper_y-6;
			}

			//under part

			var underline_y=cell_attr.cell_offset_y+t+cell_attr.k+3;

			//under lines
			var underlines=score.underlines;
			if(score.triplets){
				underlines=1;
			}
			if(underlines && underlines>0){
				for(var i=0;i<underlines;i++){
					SinriScoreDrawer.drawLine(
						canvas,
						[cell_attr.cell_offset_x,underline_y],
						[cell_attr.cell_offset_x+cell_attr.ss,underline_y]
					);
					underline_y=underline_y+3;
				}
			}
			//under points
			var underpoints=score.underpoints;
			if(underpoints && underpoints>0){
				underline_y=underline_y+1;
				for(var i=0;i<underpoints;i++){
					SinriScoreDrawer.drawDot(
						canvas,
						[cell_attr.cell_offset_x+cell_attr.ss/2,underline_y],
						2
					);
					underline_y=underline_y+6;
				}
			}

			//keep
			if(score.keep_start && score.keep_end){
				SinriScoreDrawer.drawArcForKeep(
					canvas,
					cell_attr.cell_offset_x+cell_attr.ss*0.1,
					cell_attr.cell_offset_x+cell_attr.ss*0.9,
					upper_y,
					cell_attr.ss*0.9*0.2
				);
			}else if(score.keep_start){
				var triplets=false;
				if(score.triplets){
					triplets=score.triplets;
				}
				var last_index=SinriScoreDrawer.keep_sign_set.length-1;
				if(last_index>=0 && !SinriScoreDrawer.keep_sign_set[last_index].end){
					SinriScoreDrawer.keep_sign_set[last_index].start={
						x:cell_attr.cell_offset_x+cell_attr.ss*0.5,
						y:upper_y,
						triplets:triplets
					};
				}else{
					SinriScoreDrawer.keep_sign_set.push({
						start:{
							x:cell_attr.cell_offset_x+cell_attr.ss*0.5,
							y:upper_y,
							triplets:triplets
						}
					});
				}
			}else if(score.keep_end){
				var last_index=SinriScoreDrawer.keep_sign_set.length-1;
				if(last_index>=0 && !SinriScoreDrawer.keep_sign_set[last_index].end){
					SinriScoreDrawer.keep_sign_set[last_index].end={
						x:cell_attr.cell_offset_x+cell_attr.ss*0.5,
						y:upper_y
					};
				}
			}
		}
	},
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
	parseScoreString:function(score_text){
		var score_data=[];
		var lines=score_text.split(/[\r\n]+/);
		for(var line_index=0;line_index<lines.length;line_index++){
			var notes=lines[line_index].trim().split(/[ ]+/);
			var line_data=[];
			var type=null;
			var first_note_char=notes[0];
			if(first_note_char==='~'){
				type='TITLE';
				var title=(notes.shift() ? notes.join(' ') : lines[line_index]);
				notes=[title];
			}else if(first_note_char==='>'){
				type='LYRIC';
				notes=lines[line_index].slice(2).split('');
				// alert(notes);
			}
			for(var note_index=0;note_index<notes.length;note_index++){
				var note_results=SinriScoreDrawer.parseNoteString(notes[note_index],type);
				console.log("PARSE",notes[note_index],JSON.stringify(note_results));
				for(var i=0;i<note_results.length;i++){
					line_data.push(note_results[i]);
				}
			}
			score_data.push(line_data);
		}
		return score_data;
	},
	parseNoteString:function(note_text,type){
		if(type==='TITLE'){
			return [{
				special_note:'AS_IS',
				note:note_text,
				title:true
			}]
		}
		else if(type==='LYRIC'){
			return [{
				special_note:'AS_IS',
				note:note_text
			}]
		}
		
		if(note_text==='||:'){
			return [{special_note:'REPEAT_START_DOUBLE'}];
		}
		else if(note_text===':||'){
			return [{special_note:'REPEAT_END_DOUBLE'}];
		}
		else if(note_text==='|:'){
			return [{special_note:'REPEAT_START_SINGLE'}];
		}
		else if(note_text===':|'){
			return [{special_note:'REPEAT_END_SINGLE'}];
		}
		else if(note_text==='||'){
			return [{special_note:'FIN'}];
		}
		else if(note_text==='|'){
			return [{special_note:'PHARSE_FIN'}];
		}

		//ELSE
		/*
		 *0->1 [\(]?
		 *01->2 [#b]?
		 *012... ([0]|[1-7](\<*|\>*))
		 **3->4
		 *3... (\.|_+|\-+|\*[1-9][0-9]*|\/[1-9][0-9]*)?
		 **3->4 \.
		 **35->5 
		 * [\)]?
		 */
		var regex=/^[\(]?[#bn]?([0]|([1-7](\<|\>)*))[~]?((\.)|(_+)|(\-+)|(\*[1-9][0-9]*)|(\/[1-9][0-9]*))?[\)]?(:[A-Z]+)?$/;
		if(!regex.test(note_text)){
			return [{
				special_note:'AS_IS',
				note:note_text
			}]
		}

		var note={};
		var flag=0;//beginning
		var has_long_line=0;
		var times_divided=0;
		var times_multiply=0;

		var parts=note_text.split(':');
		if(parts[1] && SinriScoreDrawer.NoteEffectWordDictory[parts[1]]){
			note.effect_word=SinriScoreDrawer.NoteEffectWordDictory[parts[1]];
		}
		note_text=parts[0];

		for(var i=0;i<note_text.length;i++){
			var c=note_text[i];
			if(c==='('){
				if(flag===0){
					note.keep_start=true;
					flag=1;//has keep_start
				}
			}else if(c==='#'){
				if(flag<=1){
					note.sharp=true;
					flag=2;//has sharp/flat
				}
			}else if(c==='b'){
				if(flag<=1){
					note.flat=true;
					flag=2;//has sharp/flat
				}
			}else if(c==='n'){
				if(flag<=1){
					note.natual=true;
					flag=2;//has sharp/flat
				}
			}else if(c>='0' && c<='9'){
				if(flag<=2){
					note.note=c;
					flag=3;//has note
				}else if(flag===7){
					times_multiply=times_multiply*10+1*c;
					flag=7;//*
				}else if(flag===8){
					times_divided=times_divided*10+1*c;
					flag=8;//\
				}
			}else if(c=='<'){
				if(flag===3){
					if(note.underpoints){
						note.underpoints+=1;
					}else{
						note.underpoints=1;
					}
					flag=3;
				}
			}else if(c=='>'){
				if(flag===3){
					if(note.upperpoints){
						note.upperpoints+=1;
					}else{
						note.upperpoints=1;
					}
					flag=3;
				}
			}else if(c==='.'){
				if(flag===3){
					note.dot=true;
					flag=4;//has dot
				}
			}else if(c==='_'){
				if(flag===3 || flag===5){
					if(note.underlines){
						note.underlines+=1;
					}else{
						note.underlines=1;
					}
					flag=5;//has underlines
				}
			}else if(c==='-'){
				if(flag===3 || flag===6){
					has_long_line+=1;
					flag=6;//has long line
				}
			}else if(c==='*'){
				if(flag===3 || flag===7){
					flag=7;
				}
			}else if(c==='\/'){
				if(flag===3 || flag===8){
					flag=8;
				}
			}else if(c===')'){
				if(flag>3){
					note.keep_end=true;
					flag=9;
				}
			}else if(c==='~'){
				if(flag===3){
					note.fermata=true;
					flag=3;
				}
			}
		}

		var fin_long_line_has_dot=false;
		if(times_multiply>0){
			note.times_multiply=times_multiply;
			if(times_multiply%2===0){
				has_long_line=times_multiply/2;
			}
			else{
				has_long_line=Math.floor(times_multiply/2);
				fin_long_line_has_dot=true;
			}
		}
		if(times_divided>0){
			note.times_divided=times_divided;
			if(times_divided===3){
				note.triplets=true;
			}
			else if(times_divided%2===0){
				note.underlines=times_divided/2;
			}
			else{
				note.underlines=Math.floor(times_divided/2);
				note.dot=true;
			}
		}

		var notes=[note];
		for(var i=0;i<has_long_line;i++){
			notes.push({
				special_note:'LONGER_LINE',
				dot:fin_long_line_has_dot
			});
		}

		return notes;
	},
	NoteEffectWordDictory:{
		"F":'f',
		"FF":'ff',
		"P":'p',
		"PP":'pp'
	},
}