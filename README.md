# SinriScoreDrawer
A tool to parse and draw numbered musical notation with lyrics.

[![Code Climate](https://codeclimate.com/github/sinri/SinriScoreDrawer/badges/gpa.svg)](https://codeclimate.com/github/sinri/SinriScoreDrawer)
[![Issue Count](https://codeclimate.com/github/sinri/SinriScoreDrawer/badges/issue_count.svg)](https://codeclimate.com/github/sinri/SinriScoreDrawer)
GitHub Raw File CDN: [https://raw.githubusercontent.com/sinri/SinriScoreDrawer/master/SinriScoreDrawer.js](https://raw.githubusercontent.com/sinri/SinriScoreDrawer/master/SinriScoreDrawer.js)

## 缘起

“小群的诗歌本”需要存储圣诗歌谱，之前开发的<a href="https://github.com/sinri/Monochrome">Monochrome</a>图片有损压缩起了相当的作用。然而因为圣诗太多，整体应用的存储占用还是百兆级别，这个还是有优化的必要。

本工具尝试将圣诗歌谱数字化存储后再还原成图片以供显示。歌谱采用简谱。

本工具可以处理一般复杂度的圣诗的简谱。

## 语法

### 前提

* 圣诗由声明、歌谱、歌词三种内容构成。
* 声明 按行存储，不需要解析的纯文本。
* 歌谱 按行存储，需要解析的纯文本。
* 歌词 按行存储，需要解析的纯文本。
* 还原时，依次解析各行并绘制结果。

### 声明

以前导`~ `开头的一行文本，前导之后的字符串原文输出。

	~ 1=D 2/2 | XB005 | Author: George Webster

如果需要控制距离，可以用全角空格。半角空格等标准空白字符将被合并。

### 歌词

以前导`> `开头的一行文本，前导之后的字符串，按照一个字符占一格的方式输出。因此，如果歌词字符之间有歌谱的小节线等，需要使用空格留空。

	> 需 要  耶稣   需 要  耶稣   人人 都需要耶 稣

此外，以前导`# `开头一行文本，自动在最前面一列加上小节序号（自增）以区分小节。以前导`@ `开头一行文本，自动在最前面一列加上“和”来表示和歌。有此二种者，歌谱和普通歌词行自动缩进一格。

### 歌谱

歌谱行由音符和控制符号构成。

#### 音符

按照如下正则表达式解析。不符合此校验者将被原样输出。

	^[\(]?[#bn]?([0]|([1-7](\<|\>)*))[~]?((\.)|(\.?_+)|(\-+)|(\*[1-9][0-9]*)|(\/[1-9][0-9]*))?[\)]?(:[A-Z]+)?$
		

#### 控制符号

包括以下类型。

	||: 
	:||
	|:
	:|
	|
	||
		
#### 音符构成

音符构成按如下顺序进行，标记从空白开始。

1. 我们使用通行的标准的4分音符作为原位音程，用`1`,`2`,`3`,`4`,`5`,`6`,`7`表示标准音高，而`0`表示休止符。现在我们得到的标记为`1`。
2. 当音高发生高八度的时候，在当前标记的右边加上`>`；低八度的时候，在当前标记的右边加上`<`。如`1>`和`1<`。
3. 当我们需要标记♯、♭、♮的时候，在当前标记的左边加上`#`、`b`、`n`。如`#1>`。（倍升音符之类的罕见物品请不要强求。）
4. 当我们需要标记非四分之一音程的时候，分3类：延长线、下划线、附点和三连音。一个延长线在当前标记的右边加上`-`。一个下划线在当前标记的右边加上`_`。附点在当前标记右边加上`.`。三连音在当前标记右边加上`~`。
5. 如果本音符是连音线的起始，在当前标记左边加上`(`。如果本音符是连音线的结束，在当前标记右边加上`)`。
6. 如果有特殊标记，在当前标记右侧加上`:`以及标记代码。

特殊标记代码如下

	`F`: f,
	`FF`: ff,
	`P`: p,
	`PP`: pp,
	`MP`: mp,
	`MF`: mf,
	`POCO`: poco,
	`DIM`: dim...,
	`CRES`: cres...,
	`RIT`: rit...,
	`RALL`: rall...,
	`ATEMPO`: a tempo,
	`VF`: >

## 样本

	5- 5- | 3 5-- | 1>- 1>- | 6 1>-- | 
	5- 5- | 6 5 5 3 | (2--- | 2--) 0 |
	3 3 3 2 | 2 1 1- | 5 5 5 4 | 3 4 5- |
	6 1> 1>. 6_ | 5 1> 1> 1> | 3- 2- | 2 1-- ||

自行下载本项目并利用example.htm配合JS文件在浏览器中观测效果。

# 许可

本项目以GPLv3发布对外许可。作者自身及特别声明的相关实体之版权范围内其他项目引用此项目不在此限。
