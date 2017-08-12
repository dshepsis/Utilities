#include <vector>
#include <string>

//Returns a vector containing the substrings of s which were separated by instances of delim.
//The deliminating strings are removed, and empty tokens are included (e.g. the 0-length
//substrings which would occur between two consecutive instances of delim).
//
//The tokenMod function is applied to each token as it is extracted.
//This can be used to parse the tokens (e.g. from string to int) in place, without
//Wasting time and memory doing so separately.
template <typename T, typename Function>
vector<T> split (const string& s, const string& delim, Function tokenMod, bool skipEmpty = false){
	int first = 0;
	int last = 0;
	vector<T> tokens;
	while (last < s.length()) {
		last = s.find(delim, first);
		if (!skipEmpty || last != first)tokens.push_back((*tokenMod)(s.substr(first, last-first)));
		first = last + delim.length();
	}
	return tokens;
}

//Overloads split() to make the tokenMod function optional.
//This will simmply return a vector of string tokens extracted from s, as separated by delim.
vector<string> split (const string& s, const string& delim) {
	return split<string>(s, delim, [](const string& s) {return s;});
}
