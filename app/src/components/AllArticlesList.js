import { getPinnedArticles } from '../util/pins';
import { getArticle } from '../selectors';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import ArticleListItem from './ArticleListItem';
import Waypoint from 'react-waypoint';
import loaderIcon from '../images/loaders/default.svg';
import Img from 'react-image';
import { getFeed } from '../util/feeds';

class AllArticles extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			cursor: 0,
			reachedEndOfFeed: false,
		};
	}
	componentDidMount() {
		this.getArticleFeed();
		getPinnedArticles(this.props.dispatch);
	}
	getArticleFeed() {
		getFeed(this.props.dispatch, 'article', this.state.cursor, 10);
	}
	render() {
		return (
			<React.Fragment>
				<div className="list-view-header content-header">
					<h1>All Articles</h1>
				</div>

				<div className="list content">
					{this.props.articles.map(article => {
						return (
							<ArticleListItem
								key={article._id}
								pinArticle={() => {
									this.props.pinArticle(article._id);
								}}
								unpinArticle={() => {
									this.props.unpinArticle(article.pinID, article._id);
								}}
								{...article}
							/>
						);
					})}
					{this.state.reachedEndOfFeed ? (
						<div className="end">
							<p>{'That\'s it! No more articles here.'}</p>
							<p>
								{
									'What, did you think that once you got all the way around, you\'d just be back at the same place that you started? Sounds like some real round-feed thinking to me.'
								}
							</p>
						</div>
					) : (
						<div>
							<Waypoint
								onEnter={() => {
									this.setState(
										{
											cursor: this.state.cursor + 1,
										},
										() => {
											this.getArticleFeed();
										},
									);
								}}
							/>
							<div className="end-loader">
								<Img src={loaderIcon} />
							</div>
						</div>
					)}
				</div>
			</React.Fragment>
		);
	}
}

AllArticles.defaultProps = {
	articles: [],
};

AllArticles.propTypes = {
	articles: PropTypes.arrayOf(PropTypes.shape({})),
	dispatch: PropTypes.func.isRequired,
	pinArticle: PropTypes.func,
	unpinArticle: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => {
	let articles = [];
	let userArticleFeed = [];
	if (state.feeds && state.feeds[`user_article:${localStorage['authedUser']}`]) {
		userArticleFeed = state.feeds[`user_article:${localStorage['authedUser']}`];
	}
	for (let articleID of userArticleFeed) {
		// need to trim the `episode:` from the episode ID
		articles.push(getArticle(state, articleID.replace('article:', '')));
	}

	for (let article of articles) {
		// attach pinned state
		if (state.pinnedArticles && state.pinnedArticles[article._id]) {
			article.pinned = true;
			article.pinID = state.pinnedArticles[article._id]._id;
		} else {
			article.pinned = false;
		}

		if (
			state.feeds[`user_article:${localStorage['authedUser']}`].indexOf(
				article._id,
			) < 20 &&
			state.feeds[`user_article:${localStorage['authedUser']}`].indexOf(
				article._id,
			) !== -1
		) {
			article.recent = true;
		} else {
			article.recent = false;
		}
	}

	return { ...ownProps, articles };
};

export default connect(mapStateToProps)(AllArticles);
