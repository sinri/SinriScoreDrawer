# SinriScoreDrawer
A tool to parse and draw numbered musical notation with lyrics.
[![Code Climate](https://codeclimate.com/github/sinri/SinriScoreDrawer/badges/gpa.svg)](https://codeclimate.com/github/sinri/SinriScoreDrawer)
[![Issue Count](https://codeclimate.com/github/sinri/SinriScoreDrawer/badges/issue_count.svg)](https://codeclimate.com/github/sinri/SinriScoreDrawer)

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

### 歌谱

歌谱行由音符和控制符号构成。

#### 音符

按照如下正则表达式解析。不符合此校验者将被原样输出。

	^[\(]?[#bn]?([0]|([1-7](\<*|\>*)))[~]?((\.)|(_+)|(0)|(\*[1-9][0-9]*)|(\/[1-9][0-9]*))?[\)]?$

#### 控制符号

包括以下类型。

	||: 
	:||
	|:
	:|
	|
	||
		
#### 例子

	5- 5- | 3 5-- | 1>- 1>- | 6 1>-- | 5- 5- | 6 5 5 3 | (2--- | 2--) 0 |

## 样本

自行下载本项目并利用example.htm文件观测效果。